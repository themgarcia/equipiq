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
}

// Guardrails
const MAX_GRID_ROWS = 200;
const MAX_GRID_COLS = 30;
const MAX_GRID_CELLS = 6000;

// System prompt for spreadsheet extraction
const getSystemPrompt = () => `You are an equipment data extraction assistant specialized in analyzing spreadsheet data for landscaping and construction equipment.

TASK: Extract equipment records from the provided 2D grid (spreadsheet data).

GRID ANALYSIS RULES:
1. The grid is a 2D array where each sub-array is a row, and each element is a cell value
2. Identify header rows (usually the first non-empty row with text labels)
3. Each data row typically represents one equipment item
4. IGNORE rows that are:
   - Column headers/labels (first row is usually headers)
   - Subtotals, totals, or summary rows (contain words like "Total", "Subtotal", "Sum", "Grand Total")
   - Empty or mostly empty rows
   - Section headers or category labels
   - Footer rows with notes or metadata
5. If multiple tables exist in the grid (separated by empty rows), extract from ALL tables

VALUE NORMALIZATION:
- Currency: Remove $, commas, handle (parentheses) as negative values
- Dates: Convert to YYYY-MM-DD format
- Year: Extract 4-digit year (model year, not purchase date)
- Numbers: Parse numeric strings, ignore units

CATEGORY CLASSIFICATION (REQUIRED):
Suggest a category for each equipment item. Valid categories:
- "Compaction (Light)": Tamping rammers, plate compactors, jumping jacks
- "Compaction (Heavy)": Ride-on rollers, large plate compactors
- "Excavator – Compact (≤ 6 ton)": Mini excavators under 6 tons
- "Excavator – Mid-Size (6–12 ton)": Medium excavators 6-12 tons
- "Excavator – Large (12+ ton)": Large excavators over 12 tons
- "Handheld Power Tools": Battery/gas powered hand tools
- "Large Demo & Specialty Tools": Walk-behind saws, stump grinders
- "Lawn (Commercial)": Zero-turn mowers, commercial mowers
- "Lawn (Handheld)": String trimmers, blowers, edgers
- "Loader – Skid Steer Mini": Ditch Witch, Toro Dingo mini skid steers
- "Loader – Skid Steer": Wheeled skid steers, compact track loaders
- "Loader – Mid-Size": Larger CTLs, smaller wheel loaders
- "Loader – Wheel / Large": Full wheel loaders
- "Shop / Other": Generators, pressure washers, shop equipment
- "Snow Equipment": Plows, spreaders, snow blowers
- "Trailer": Equipment trailers, utility trailers, dump trailers
- "Vehicle (Commercial)": Dump trucks, service trucks, F-450+
- "Vehicle (Light-Duty)": Pickups, vans, SUVs, F-150/F-250/F-350

ATTACHMENT DETECTION:
- Attachments include: buckets, forks, blades, augers, trenchers, grapples, plows, spreaders, dump bodies
- For attachments: set suggestedType: "attachment" and suggestedParentIndex to the 0-based index of the parent equipment

CONFIDENCE:
- "high": Data is clear and complete
- "medium": Some fields missing or unclear
- "low": Significant uncertainty or assumptions made

Return warnings for any issues (multiple tables detected, ambiguous data, skipped rows).`;

const getToolDefinition = () => ({
  type: "function",
  function: {
    name: "extract_equipment_from_spreadsheet",
    description: "Extract equipment data from spreadsheet grid",
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
              year: { type: ["number", "null"], description: "Model year (4-digit)" },
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
              notes: { type: ["string", "null"], description: "Additional notes or warnings" },
              suggestedType: {
                type: "string",
                enum: ["equipment", "attachment"],
                description: "Whether this is primary equipment or an attachment"
              },
              suggestedParentIndex: {
                type: ["number", "null"],
                description: "For attachments, the 0-based index of the parent equipment"
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
                description: "Suggested equipment category"
              }
            },
            required: ["make", "model", "confidence", "suggestedType", "suggestedCategory"]
          }
        },
        warnings: {
          type: "array",
          items: { type: "string" },
          description: "Warnings about the extraction (e.g., 'Multiple tables detected', 'Low confidence rows')"
        },
        processingNotes: {
          type: "string",
          description: "Summary of extraction process"
        }
      },
      required: ["equipment", "warnings", "processingNotes"]
    }
  }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await serviceClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    userId = claimsData.claims.sub;

    // Parse request body
    const { sheetName, grid, fileName, range } = await req.json();

    console.log(`[parse-equipment-spreadsheet] Processing: ${fileName}, sheet: ${sheetName}, grid size: ${grid?.length}x${grid?.[0]?.length || 0}`);

    // Validate grid
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or empty grid data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply guardrails
    const boundedGrid = grid.slice(0, MAX_GRID_ROWS).map((row: any[]) => 
      (row || []).slice(0, MAX_GRID_COLS)
    );
    
    const cellCount = boundedGrid.reduce((sum: number, row: any[]) => sum + (row?.length || 0), 0);
    if (cellCount > MAX_GRID_CELLS) {
      console.log(`[parse-equipment-spreadsheet] Grid exceeds cell limit: ${cellCount} > ${MAX_GRID_CELLS}`);
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Analyze this spreadsheet data and extract equipment records.

Sheet name: ${sheetName || 'Unknown'}
File name: ${fileName || 'Unknown'}
Grid dimensions: ${boundedGrid.length} rows x ${boundedGrid[0]?.length || 0} columns

SPREADSHEET DATA (2D grid as JSON):
${JSON.stringify(boundedGrid, null, 2)}

Extract all equipment items from this data. Look for columns that might contain:
- Make/Manufacturer
- Model
- Year
- Serial Number / VIN
- Purchase Date
- Purchase Price
- Financing information

Ignore header rows, totals, and empty rows. Return the extracted equipment.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: userPrompt }
        ],
        tools: [getToolDefinition()],
        tool_choice: { type: 'function', function: { name: 'extract_equipment_from_spreadsheet' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[parse-equipment-spreadsheet] AI Gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits to continue' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('[parse-equipment-spreadsheet] AI response received');

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No tool call response from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    console.log(`[parse-equipment-spreadsheet] Extracted ${result.equipment?.length || 0} equipment items`);

    // Log activity
    try {
      await serviceClient.from('user_activity_log').insert({
        user_id: userId,
        action_type: 'equipment_spreadsheet_import',
        action_details: {
          fileName,
          sheetName,
          gridRows: boundedGrid.length,
          gridCols: boundedGrid[0]?.length || 0,
          extractedCount: result.equipment?.length || 0,
        },
      });
    } catch (logErr) {
      console.error('Failed to log activity:', logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        equipment: result.equipment || [],
        warnings: result.warnings || [],
        processingNotes: result.processingNotes || `Extracted ${result.equipment?.length || 0} items from spreadsheet`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-equipment-spreadsheet] Error:', error);
    
    // Log error
    try {
      await serviceClient.from('error_log').insert({
        user_id: userId,
        error_source: 'parse-equipment-spreadsheet',
        error_type: 'processing_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: { stack: error instanceof Error ? error.stack : null },
        severity: 'error',
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
