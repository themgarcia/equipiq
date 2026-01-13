import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedBrokerInfo {
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
}

interface ExtractedPolicyInfo {
  policyNumber: string | null;
  effectiveDate: string | null;
  renewalDate: string | null;
}

interface ExtractedScheduledEquipment {
  description: string;
  make: string | null;
  model: string | null;
  year: number | null;
  serialVin: string | null;
  declaredValue: number | null;
  coverageNotes: string | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ExtractedPolicyData {
  brokerInfo: ExtractedBrokerInfo;
  policyInfo: ExtractedPolicyInfo;
  scheduledEquipment: ExtractedScheduledEquipment[];
}

// Input validation constants
const MAX_BASE64_SIZE = 20 * 1024 * 1024 * 1.37; // ~27MB base64 for 20MB file
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
      error_source: 'parse-insurance-docs',
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
  let fileName: string | null = null;
  let documentType: string | null = null;
  let fileSizeBytes: number | null = null;
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
    const documentBase64 = body.documentBase64;
    documentType = body.documentType;
    fileName = body.fileName;
    fileSizeBytes = documentBase64 ? Math.round(documentBase64.length * 0.75) : null;

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

    // Input validation: Check document size (prevent oversized uploads)
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

    console.log(`Processing insurance document: ${fileName}, type: ${documentType}`);

    const systemPrompt = `You are an insurance document extraction assistant specialized in reading insurance policy declaration pages, equipment schedules, and certificates of insurance.

Your task is to extract the following information from the uploaded insurance document:

1. BROKER/AGENT CONTACT INFORMATION:
   - Agent/Broker Name (the person's name)
   - Agency/Brokerage Company Name
   - Email Address (if visible)
   - Phone Number (if visible)

2. POLICY DETAILS:
   - Policy Number
   - Policy Effective Date (start date)
   - Policy Renewal/Expiration Date

3. SCHEDULED EQUIPMENT LIST:
   For each piece of equipment listed on the schedule/declaration:
   - Description (full text description from the document)
   - Make/Manufacturer (if you can identify it from the description)
   - Model (if you can identify it from the description)
   - Year (if visible)
   - Serial Number or VIN (if visible)
   - Declared/Scheduled Value (the insured value - this is NOT the purchase price)
   - Coverage Notes (any special coverage terms, deductibles, or notes for this item)

IMPORTANT NOTES:
- The "declared value" or "scheduled value" is what the equipment is insured FOR. This is typically NOT the original purchase price.
- Equipment descriptions may be abbreviated or formatted differently than typical equipment databases.
- Look for section headers like "Scheduled Equipment", "Equipment Schedule", "Property Schedule", "Scheduled Inland Marine", etc.
- Some documents may have multiple pages or sections - extract ALL equipment listed.
- If a field cannot be found, set it to null.
- Set confidence to "high" if clearly legible, "medium" if somewhat unclear, "low" if assumptions were made.

PARSING EQUIPMENT DESCRIPTIONS:
- Try to parse "2019 John Deere Z950R" into year=2019, make="John Deere", model="Z950R"
- If the description is just "Excavator" without details, set make/model/year to null but include the full description
- Watch for serial numbers which may be labeled as "S/N", "Serial", "VIN", or similar`;

    const userPrompt = `Please analyze this insurance document and extract the broker contact information, policy details, and all scheduled/insured equipment. Return the data using the extract_insurance_policy function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_insurance_policy",
              description: "Extract insurance policy data including broker info, policy details, and scheduled equipment",
              parameters: {
                type: "object",
                properties: {
                  brokerInfo: {
                    type: "object",
                    properties: {
                      name: { type: ["string", "null"], description: "Broker/agent contact name" },
                      company: { type: ["string", "null"], description: "Brokerage/agency company name" },
                      email: { type: ["string", "null"], description: "Broker email address" },
                      phone: { type: ["string", "null"], description: "Broker phone number" }
                    },
                    required: ["name", "company", "email", "phone"]
                  },
                  policyInfo: {
                    type: "object",
                    properties: {
                      policyNumber: { type: ["string", "null"], description: "Policy number" },
                      effectiveDate: { type: ["string", "null"], description: "Policy effective/start date in YYYY-MM-DD format" },
                      renewalDate: { type: ["string", "null"], description: "Policy renewal/expiration date in YYYY-MM-DD format" }
                    },
                    required: ["policyNumber", "effectiveDate", "renewalDate"]
                  },
                  scheduledEquipment: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string", description: "Full equipment description from document" },
                        make: { type: ["string", "null"], description: "Manufacturer/brand if identifiable" },
                        model: { type: ["string", "null"], description: "Model number/name if identifiable" },
                        year: { type: ["number", "null"], description: "Year if visible" },
                        serialVin: { type: ["string", "null"], description: "Serial number or VIN if visible" },
                        declaredValue: { type: ["number", "null"], description: "Declared/scheduled insurance value" },
                        coverageNotes: { type: ["string", "null"], description: "Any coverage notes or terms for this item" },
                        confidence: { 
                          type: "string", 
                          enum: ["high", "medium", "low"],
                          description: "Confidence level of extraction" 
                        }
                      },
                      required: ["description", "confidence"]
                    }
                  }
                },
                required: ["brokerInfo", "policyInfo", "scheduledEquipment"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_insurance_policy" } }
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

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_insurance_policy") {
      await logError(serviceClient, userId, 'ai_extraction_failed', 'No policy data extracted from document', {
        fileName,
        documentType,
        fileSizeBytes,
        processingTimeMs,
        aiResponse: JSON.stringify(data).substring(0, 1000),
      });
      throw new Error("No policy data extracted from document");
    }

    const extractedData: ExtractedPolicyData = JSON.parse(toolCall.function.arguments);

    console.log(`Extracted policy data: broker=${extractedData.brokerInfo.name}, policy=${extractedData.policyInfo.policyNumber}, equipment=${extractedData.scheduledEquipment.length} items`);

    // Log successful extraction
    await logActivity(serviceClient, userId, userEmail!, 'insurance_import_success', {
      fileName,
      documentType,
      fileSizeBytes,
      processingTimeMs,
      equipmentCount: extractedData.scheduledEquipment.length,
      policyNumber: extractedData.policyInfo.policyNumber,
      brokerName: extractedData.brokerInfo.name,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      ...extractedData,
      fileName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error('Error in parse-insurance-docs function:', error);
    
    // Log the error
    await logError(serviceClient, userId, 'unexpected_error', error instanceof Error ? error.message : 'Unknown error occurred', {
      fileName,
      documentType,
      fileSizeBytes,
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