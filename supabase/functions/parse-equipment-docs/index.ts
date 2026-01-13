import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EquipmentCategory = 
  | 'Compaction (Heavy)'
  | 'Compaction (Light)'
  | 'Excavator – Compact (≤ 6 ton)'
  | 'Excavator – Mid-Size (6–12 ton)'
  | 'Excavator – Large (12+ ton)'
  | 'Handheld Power Tools'
  | 'Large Demo & Specialty Tools'
  | 'Lawn (Commercial)'
  | 'Lawn (Handheld)'
  | 'Loader – Skid Steer Mini'
  | 'Loader – Skid Steer'
  | 'Loader – Mid-Size'
  | 'Loader – Wheel / Large'
  | 'Shop / Other'
  | 'Snow Equipment'
  | 'Trailer'
  | 'Vehicle (Commercial)'
  | 'Vehicle (Light-Duty)';

interface ExtractedEquipment {
  make: string;
  model: string;
  year: number | null;
  serialVin: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  salesTax: number | null;
  freightSetup: number | null;
  financingType: 'owned' | 'financed' | 'leased' | null;
  depositAmount: number | null;
  financedAmount: number | null;
  monthlyPayment: number | null;
  termMonths: number | null;
  buyoutAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
  suggestedType: 'equipment' | 'attachment';
  suggestedParentIndex: number | null;
  purchaseCondition: 'new' | 'used' | null;
  suggestedCategory: EquipmentCategory | null;
  sourceDocumentIndices?: number[];
}

interface DocumentSummary {
  fileName: string;
  extracted: string[];
  itemsFound: string[];
}

interface FieldConflict {
  field: string;
  values: any[];
  sources: string[];
  resolved: any;
}

interface BatchDocument {
  base64: string;
  type: string;
  fileName: string;
}

// Input validation constants
const MAX_BASE64_SIZE = 20 * 1024 * 1024 * 1.37; // ~27MB base64 for 20MB file
const MAX_DOCUMENTS = 10; // Maximum documents per batch
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Helper function to log errors to the database
async function logError(
  serviceClient: any,
  userId: string | null,
  errorType: string,
  errorMessage: string,
  errorDetails: Record<string, any>,
  severity: 'error' | 'warning' | 'info' = 'error'
) {
  try {
    await serviceClient.from('error_log').insert({
      user_id: userId,
      error_source: 'parse-equipment-docs',
      error_type: errorType,
      error_message: errorMessage,
      error_details: errorDetails,
      severity,
    });
  } catch (logErr) {
    console.error('Failed to log error to database:', logErr);
  }
}

// Helper function to log user activity
async function logActivity(
  serviceClient: any,
  userId: string,
  userEmail: string,
  actionType: string,
  actionDetails: Record<string, any>
) {
  try {
    await serviceClient.from('user_activity_log').insert({
      user_id: userId,
      user_email: userEmail,
      action_type: actionType,
      action_details: actionDetails,
    });
  } catch (logErr) {
    console.error('Failed to log activity to database:', logErr);
  }
}

// System prompt for auto-detection mode (consolidation with smart detection)
const getAutoDetectSystemPrompt = () => `You are an equipment data extraction assistant specialized in reading purchase orders, invoices, financing agreements, and lease agreements for landscaping equipment.

AUTO-DETECTION MODE INSTRUCTIONS:
Analyze the uploaded documents and intelligently determine if they describe:
A) The SAME equipment purchase (multiple docs for one asset - e.g., invoice + registration + financing)
B) DIFFERENT equipment purchases (separate invoices for different assets)

DETECTION RULES:
- If documents share the SAME VIN/serial number, make/model, or are clearly related (e.g., invoice and financing for same purchase) → Consolidate into ONE record
- If documents have DIFFERENT VINs/serials, different make/models, or are clearly separate transactions → Return MULTIPLE records

CRITICAL - AVOID FRAGMENTATION:
- A single piece of equipment should produce ONE record
- Do NOT create separate records for different description lines, features, or specifications of the SAME item
- If an invoice lists "Eloquip Aluminum Dump Body with fold-down sides, tarp system, and rake rack":
  - This is ONE attachment, not four separate items
  - Extract as: make: "Eloquip", model: "Aluminum Dump Body", notes: "Includes fold-down sides, tarp system, rake rack"
- Line items describing FEATURES of equipment are NOT separate equipment items
- Only create separate records when there are clearly DISTINCT pieces of equipment with their own prices
- If line items share the same manufacturer and are on the same invoice/document, they are likely the SAME item unless they have different prices

ATTACHMENT HANDLING:
- Attachments include: buckets, forks, blades, augers, trenchers, grapples, pallet forks, plows, spreaders, dump bodies, toolboxes, racks
- If multiple line items refer to the SAME attachment (same manufacturer, similar descriptions):
  - Consolidate into ONE attachment record
  - Combine features/descriptions into the notes field
  - Sum up any additional line item costs if applicable
- For attachments: suggestedType: "attachment", suggestedParentIndex: 0 (pointing to parent equipment)

For CONSOLIDATION (multiple docs for same equipment):
1. Extract ONE primary equipment record with the best-supported values from ALL documents
2. Identify attachments (buckets, plows, etc.) as separate items with suggestedType: "attachment"
3. Use the best value for each field across all documents
4. Prefer: Registration docs for VIN/serial, Purchase orders for pricing, Financing agreements for loan terms

For SEPARATE ASSETS:
1. Extract each equipment item as a separate record
2. Each record should reference its source document(s) via sourceDocumentIndices

CATEGORY CLASSIFICATION (REQUIRED):
You MUST suggest a category for each piece of equipment. Valid categories:
- "Compaction (Light)": Tamping rammers, vibratory rammers, jumping jacks, walk-behind plate compactors (Bartell, Wacker Neuson, Bomag handheld units)
- "Compaction (Heavy)": Ride-on rollers, large plate compactors (500+ lbs), trench rollers
- "Excavator – Compact (≤ 6 ton)": Mini excavators under 6 tons (Kubota KX, CAT 303, Bobcat E35)
- "Excavator – Mid-Size (6–12 ton)": Medium excavators 6-12 tons
- "Excavator – Large (12+ ton)": Large excavators over 12 tons
- "Handheld Power Tools": Battery/gas powered hand tools, drills, demo saws
- "Large Demo & Specialty Tools": Walk-behind concrete saws, stump grinders, core drills
- "Lawn (Commercial)": Zero-turn mowers, stand-on mowers, walk-behind commercial mowers
- "Lawn (Handheld)": String trimmers, blowers, edgers, hedge trimmers, chainsaws
- "Loader – Skid Steer Mini": Ditch Witch, Vermeer, Toro Dingo mini skid steers
- "Loader – Skid Steer": Wheeled skid steers, compact track loaders (Bobcat, CAT, Case)
- "Loader – Mid-Size": Larger CTLs, smaller wheel loaders
- "Loader – Wheel / Large": Full wheel loaders, articulated loaders
- "Shop / Other": Generators, pressure washers, shop equipment, compressors
- "Snow Equipment": Plows, spreaders, snow blowers, salt equipment
- "Trailer": Equipment trailers, utility trailers, dump trailers
- "Vehicle (Commercial)": Dump trucks, cab-and-chassis, service body trucks, F-450+
- "Vehicle (Light-Duty)": Pickups, vans, SUVs, F-150/F-250/F-350

YEAR EXTRACTION (CRITICAL):
- "year" = the MODEL YEAR (manufacturing year)
- "purchaseDate" = the invoice/transaction date
- These are DIFFERENT, especially for USED equipment!

PURCHASE CONDITION (CRITICAL):
Set to "used" if: explicitly says "USED", "PRE-OWNED", from auction, rental fleet sale, "as-is" language
Set to "new" if: from authorized dealer with no "used" indicators, full manufacturer warranty

DOCUMENT SOURCE TRACKING:
Include sourceDocumentIndices as an array of 0-based indices for which documents contributed to each item.`;

// System prompt for multi-asset mode (legacy behavior)
const getMultiAssetSystemPrompt = () => `You are an equipment data extraction assistant specialized in reading purchase orders, invoices, financing agreements, and lease agreements for landscaping equipment.

Your task is to extract equipment information from the uploaded document. Look for:
- Make (manufacturer/brand like John Deere, Kubota, Stihl, Bartell, Wacker Neuson, Bomag, etc.)
- Model (model number/name)
- Year (MODEL YEAR - see detailed instructions below)
- Serial Number or VIN
- Purchase Condition (new vs used - see detailed instructions below)
- Purchase Date (invoice/order date - this is DIFFERENT from model year)
- Purchase Price (pre-tax amount for the equipment)
- Sales Tax (if itemized separately)
- Freight/Setup charges (delivery or setup fees if listed)
- Financing details if this is a financing or lease document:
  - Type: owned (cash purchase), financed (loan), or leased
  - Deposit/Down payment amount
  - Financed/Principal amount
  - Monthly payment amount
  - Term in months
  - Buyout amount (for leases)

CATEGORY CLASSIFICATION (REQUIRED):
You MUST suggest a category for each piece of equipment. Valid categories:
- "Compaction (Light)": Tamping rammers, vibratory rammers, jumping jacks, walk-behind plate compactors (Bartell, Wacker Neuson, Bomag handheld units)
- "Compaction (Heavy)": Ride-on rollers, large plate compactors (500+ lbs), trench rollers
- "Excavator – Compact (≤ 6 ton)": Mini excavators under 6 tons (Kubota KX, CAT 303, Bobcat E35)
- "Excavator – Mid-Size (6–12 ton)": Medium excavators 6-12 tons
- "Excavator – Large (12+ ton)": Large excavators over 12 tons
- "Handheld Power Tools": Battery/gas powered hand tools, drills, demo saws
- "Large Demo & Specialty Tools": Walk-behind concrete saws, stump grinders, core drills
- "Lawn (Commercial)": Zero-turn mowers, stand-on mowers, walk-behind commercial mowers
- "Lawn (Handheld)": String trimmers, blowers, edgers, hedge trimmers, chainsaws
- "Loader – Skid Steer Mini": Ditch Witch, Vermeer, Toro Dingo mini skid steers
- "Loader – Skid Steer": Wheeled skid steers, compact track loaders (Bobcat, CAT, Case)
- "Loader – Mid-Size": Larger CTLs, smaller wheel loaders
- "Loader – Wheel / Large": Full wheel loaders, articulated loaders
- "Shop / Other": Generators, pressure washers, shop equipment, compressors
- "Snow Equipment": Plows, spreaders, snow blowers, salt equipment
- "Trailer": Equipment trailers, utility trailers, dump trailers
- "Vehicle (Commercial)": Dump trucks, cab-and-chassis, service body trucks, F-450+
- "Vehicle (Light-Duty)": Pickups, vans, SUVs, F-150/F-250/F-350

YEAR EXTRACTION (CRITICAL - READ CAREFULLY):
- "year" = the MODEL YEAR of the equipment (manufacturing year, what year the equipment IS)
- "purchaseDate" = the invoice/transaction date (when it was purchased)
- These are DIFFERENT values, especially for USED equipment!
- For USED equipment, the year is typically OLDER than the purchaseDate

How to find model year:
1. Look for explicit labels: "Model Year:", "MY:", "Year:", or year in item description
2. Check model designation for year (e.g., "2019 Model", "23-series")
3. For used equipment sales, the year is often listed in the item description
4. If model year cannot be found, set year to null (system will use purchase year as fallback)

PURCHASE CONDITION (CRITICAL):
Set to "used" if ANY of these apply:
- Document explicitly says: "USED", "PRE-OWNED", "CERTIFIED PRE-OWNED", "REFURBISHED", "RECONDITIONED"
- From auction, dealer trade-in, rental fleet sale, or consignment
- "As-is" language, hour meter readings noted, prior ownership mentioned
- Limited warranty or shorter than manufacturer's new warranty
- Keywords: "previously owned", "second-hand", "rental unit"

Set to "new" if:
- From authorized dealer with no "used" indicators
- Full manufacturer warranty included
- Model year matches or is within 1 year of purchase date

If uncertain, set to null and explain in notes.

ATTACHMENT DETECTION:
Identify items that appear to be attachments or accessories rather than primary equipment:
- Buckets, forks, blades, augers, trenchers, grapples, pallet forks, etc.
- Items with significantly lower value than the main equipment on the same document
- Items that share financing terms with a larger piece of equipment (same monthly payment line)
- Items described as "includes", "with", or "accessory" relative to the main equipment

For each item, set:
- suggestedType: "equipment" for primary machines (loaders, excavators, trucks, mowers), "attachment" for accessories/implements
- suggestedParentIndex: If this is an attachment, the 0-based index of the likely parent equipment in this extraction, or null if uncertain

Be thorough and extract ALL equipment items if the document contains multiple pieces of equipment.
If a field is not clearly visible in the document, set it to null.
Set confidence to "high" if the data is clearly legible, "medium" if somewhat unclear, or "low" if you had to make assumptions.`;

const getToolDefinition = () => ({
  type: "function",
  function: {
    name: "extract_equipment",
    description: "Extract equipment data from the document(s)",
    parameters: {
      type: "object",
      properties: {
        equipment: {
          type: "array",
          items: {
            type: "object",
            properties: {
              make: { type: "string", description: "Manufacturer/brand name" },
              model: { type: "string", description: "Model number or name" },
              year: { type: ["number", "null"], description: "Model year" },
              serialVin: { type: ["string", "null"], description: "Serial number or VIN" },
              purchaseCondition: {
                type: ["string", "null"],
                enum: ["new", "used", null],
                description: "Whether equipment was purchased new or used"
              },
              purchaseDate: { type: ["string", "null"], description: "Purchase date in YYYY-MM-DD format" },
              purchasePrice: { type: ["number", "null"], description: "Purchase price before tax" },
              salesTax: { type: ["number", "null"], description: "Sales tax amount" },
              freightSetup: { type: ["number", "null"], description: "Freight and setup charges" },
              financingType: { 
                type: ["string", "null"], 
                enum: ["owned", "financed", "leased", null],
                description: "Type of financing" 
              },
              depositAmount: { type: ["number", "null"], description: "Down payment or deposit" },
              financedAmount: { type: ["number", "null"], description: "Amount financed" },
              monthlyPayment: { type: ["number", "null"], description: "Monthly payment amount" },
              termMonths: { type: ["number", "null"], description: "Term in months" },
              buyoutAmount: { type: ["number", "null"], description: "Lease buyout amount" },
              confidence: { 
                type: "string", 
                enum: ["high", "medium", "low"],
                description: "Confidence level of extraction" 
              },
              notes: { type: ["string", "null"], description: "Any additional notes about this item or conflicts detected" },
              suggestedType: {
                type: "string",
                enum: ["equipment", "attachment"],
                description: "Whether this is primary equipment or an attachment/accessory"
              },
              suggestedParentIndex: {
                type: ["number", "null"],
                description: "For attachments, the 0-based index of the parent equipment in this extraction"
              },
              suggestedCategory: {
                type: ["string", "null"],
                enum: [
                  "Compaction (Heavy)",
                  "Compaction (Light)",
                  "Excavator – Compact (≤ 6 ton)",
                  "Excavator – Mid-Size (6–12 ton)",
                  "Excavator – Large (12+ ton)",
                  "Handheld Power Tools",
                  "Large Demo & Specialty Tools",
                  "Lawn (Commercial)",
                  "Lawn (Handheld)",
                  "Loader – Skid Steer Mini",
                  "Loader – Skid Steer",
                  "Loader – Mid-Size",
                  "Loader – Wheel / Large",
                  "Shop / Other",
                  "Snow Equipment",
                  "Trailer",
                  "Vehicle (Commercial)",
                  "Vehicle (Light-Duty)",
                  null
                ],
                description: "Suggested equipment category based on make/model analysis"
              },
              sourceDocumentIndices: {
                type: "array",
                items: { type: "number" },
                description: "0-based indices of documents that contributed to this item's data"
              }
            },
            required: ["make", "model", "confidence", "suggestedType", "suggestedCategory"]
          }
        },
        documentSummaries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fileName: { type: "string" },
              extracted: { 
                type: "array", 
                items: { type: "string" },
                description: "Field names extracted from this document" 
              },
              itemsFound: { 
                type: "array", 
                items: { type: "string" },
                description: "Description of items found (e.g., 'Primary: Ford F-350', 'Attachment: Fisher Plow')" 
              }
            },
            required: ["fileName", "extracted", "itemsFound"]
          },
          description: "Summary of what was extracted from each document"
        },
        conflicts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              values: { type: "array", items: {} },
              sources: { type: "array", items: { type: "string" } },
              resolved: { description: "The value chosen to resolve the conflict" }
            },
            required: ["field", "values", "sources", "resolved"]
          },
          description: "List of conflicts detected between documents"
        },
        processingNotes: {
          type: "string",
          description: "Any overall notes about the processing or consolidation"
        }
      },
      required: ["equipment"]
    }
  }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create service role client for logging (bypasses RLS)
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let userId: string | null = null;
  let userEmail: string | null = null;
  const startTime = Date.now();

  try {
    // Verify authentication manually (verify_jwt is disabled in config)
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      await logError(serviceClient, null, 'auth_error', 'No authorization header provided', {});
      return new Response(JSON.stringify({ error: 'Unauthorized - no auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the token from the Bearer header
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      console.error('No token found in auth header');
      await logError(serviceClient, null, 'auth_error', 'No token found in auth header', {});
      return new Response(JSON.stringify({ error: 'Unauthorized - no token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the token explicitly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth verification failed:', authError?.message || 'No user found');
      await logError(serviceClient, null, 'auth_error', 'Invalid token', {
        authError: authError?.message,
      });
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    userId = user.id;
    userEmail = user.email || null;
    console.log(`Authenticated user: ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await logError(serviceClient, userId, 'config_error', 'LOVABLE_API_KEY is not configured', {});
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    
    // Detect request format: batch mode vs legacy single document
    const isBatchMode = body.documents && Array.isArray(body.documents);
    const mode = body.mode || 'single_asset';
    
    if (isBatchMode) {
      // BATCH MODE: Process multiple documents together
      const documents: BatchDocument[] = body.documents;
      
      if (documents.length === 0) {
        return new Response(JSON.stringify({ error: 'No documents provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validate document count limit
      if (documents.length > MAX_DOCUMENTS) {
        return new Response(JSON.stringify({ 
          error: `Too many documents. Maximum ${MAX_DOCUMENTS} per batch.` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log(`Processing batch of ${documents.length} documents in auto-detect mode`);
      
      // Validate all documents
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        if (!doc.base64 || typeof doc.base64 !== 'string') {
          return new Response(JSON.stringify({ error: `Document ${i + 1} has no content` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (doc.base64.length > MAX_BASE64_SIZE) {
          return new Response(JSON.stringify({ error: `Document ${doc.fileName || i + 1} is too large. Maximum size is 20MB.` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (!doc.type || !ALLOWED_DOCUMENT_TYPES.includes(doc.type)) {
          return new Response(JSON.stringify({ error: `Document ${doc.fileName || i + 1} has invalid type. Supported: PDF, JPEG, PNG, WebP, HEIC` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Build the prompt with document file names - AI auto-detects mode
      const fileNames = documents.map(d => d.fileName).join(', ');
      const userPrompt = `Please analyze these ${documents.length} documents (${fileNames}). Determine if they describe the same equipment purchase or different ones, and extract all equipment information accordingly. Return the data using the extract_equipment function.`;
      
      const systemPrompt = getAutoDetectSystemPrompt();
      
      // Build content array with all documents
      const contentArray: any[] = [
        { type: "text", text: userPrompt }
      ];
      
      for (const doc of documents) {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: `data:${doc.type};base64,${doc.base64}`
          }
        });
      }
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contentArray }
          ],
          tools: [getToolDefinition()],
          tool_choice: { type: "function", function: { name: "extract_equipment" } }
        }),
      });

      const processingTimeMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        await logError(serviceClient, userId, 'ai_gateway_error', `AI gateway returned ${response.status}`, {
          documentCount: documents.length,
          processingTimeMs,
          aiStatus: response.status,
          aiErrorText: errorText.substring(0, 500),
        });
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI response:", JSON.stringify(data, null, 2));

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== "extract_equipment") {
        await logError(serviceClient, userId, 'ai_extraction_failed', 'No equipment data extracted from documents', {
          documentCount: documents.length,
          processingTimeMs,
          aiResponse: JSON.stringify(data).substring(0, 1000),
        });
        throw new Error("No equipment data extracted from documents");
      }

      const extractedData = JSON.parse(toolCall.function.arguments);
      const equipment: ExtractedEquipment[] = extractedData.equipment || [];
      const documentSummaries: DocumentSummary[] = extractedData.documentSummaries || documents.map(d => ({
        fileName: d.fileName,
        extracted: [],
        itemsFound: []
      }));
      const conflicts: FieldConflict[] = extractedData.conflicts || [];
      const processingNotes: string = extractedData.processingNotes || '';

      console.log(`Extracted ${equipment.length} equipment items from ${documents.length} documents`);

      // Log successful extraction
      await logActivity(serviceClient, userId, userEmail!, 'equipment_import_batch_success', {
        documentCount: documents.length,
        processingTimeMs,
        equipmentCount: equipment.length,
        attachmentCount: equipment.filter(e => e.suggestedType === 'attachment').length,
        conflictsDetected: conflicts.length,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        equipment,
        documentSummaries,
        conflicts,
        processingNotes,
        documentCount: documents.length,
        fileNames: documents.map(d => d.fileName),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else {
      // LEGACY SINGLE DOCUMENT MODE
      const documentBase64 = body.documentBase64;
      const documentType = body.documentType;
      const fileName = body.fileName;
      const fileSizeBytes = documentBase64 ? Math.round(documentBase64.length * 0.75) : null;

      // Input validation: Check document presence
      if (!documentBase64 || typeof documentBase64 !== 'string') {
        console.error('No document provided or invalid format');
        await logError(serviceClient, userId, 'validation_error', 'No document provided', {
          fileName,
          documentType,
        });
        return new Response(JSON.stringify({ error: 'No document provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Input validation: Check document size
      if (documentBase64.length > MAX_BASE64_SIZE) {
        console.error(`Document too large: ${documentBase64.length} bytes (max: ${MAX_BASE64_SIZE})`);
        await logError(serviceClient, userId, 'validation_error', 'Document too large', {
          fileName,
          documentType,
          fileSizeBytes,
          maxSizeBytes: MAX_BASE64_SIZE * 0.75,
        });
        return new Response(JSON.stringify({ error: 'Document too large. Maximum size is 20MB.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Input validation: Check document type
      if (!documentType || !ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
        console.error(`Invalid document type: ${documentType}`);
        await logError(serviceClient, userId, 'validation_error', 'Invalid document type', {
          fileName,
          documentType,
          allowedTypes: ALLOWED_DOCUMENT_TYPES,
        });
        return new Response(JSON.stringify({ error: 'Invalid document type. Supported: PDF, JPEG, PNG, WebP, HEIC' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Input validation: Basic base64 format check
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(documentBase64)) {
        console.error('Invalid base64 format');
        await logError(serviceClient, userId, 'validation_error', 'Invalid base64 format', {
          fileName,
          documentType,
        });
        return new Response(JSON.stringify({ error: 'Invalid document format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Processing single document: ${fileName}, type: ${documentType}`);

      const systemPrompt = getMultiAssetSystemPrompt();
      const userPrompt = `Please analyze this document and extract all equipment information. Return the data using the extract_equipment function.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${documentType};base64,${documentBase64}`
                  }
                }
              ]
            }
          ],
          tools: [getToolDefinition()],
          tool_choice: { type: "function", function: { name: "extract_equipment" } }
        }),
      });

      const processingTimeMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        await logError(serviceClient, userId, 'ai_gateway_error', `AI gateway returned ${response.status}`, {
          fileName,
          documentType,
          fileSizeBytes,
          processingTimeMs,
          aiStatus: response.status,
          aiErrorText: errorText.substring(0, 500),
        });
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI response:", JSON.stringify(data, null, 2));

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== "extract_equipment") {
        await logError(serviceClient, userId, 'ai_extraction_failed', 'No equipment data extracted from document', {
          fileName,
          documentType,
          fileSizeBytes,
          processingTimeMs,
          aiResponse: JSON.stringify(data).substring(0, 1000),
        });
        throw new Error("No equipment data extracted from document");
      }

      const extractedData = JSON.parse(toolCall.function.arguments);
      const equipment: ExtractedEquipment[] = extractedData.equipment || [];

      console.log(`Extracted ${equipment.length} equipment items`);

      // Log successful extraction
      await logActivity(serviceClient, userId, userEmail!, 'equipment_import_success', {
        fileName,
        documentType,
        fileSizeBytes,
        processingTimeMs,
        equipmentCount: equipment.length,
        extractedMakes: equipment.map(e => e.make).join(', '),
      });

      return new Response(JSON.stringify({ 
        success: true, 
        equipment,
        fileName 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error('Error in parse-equipment-docs function:', error);
    
    // Log the error
    await logError(serviceClient, userId, 'unexpected_error', error instanceof Error ? error.message : 'Unknown error occurred', {
      processingTimeMs,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
