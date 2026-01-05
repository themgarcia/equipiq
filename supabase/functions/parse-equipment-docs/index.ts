import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Authenticated user: ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { documentBase64, documentType, fileName } = await req.json();

    if (!documentBase64) {
      throw new Error('No document provided');
    }

    console.log(`Processing document: ${fileName}, type: ${documentType}`);

    const systemPrompt = `You are an equipment data extraction assistant specialized in reading purchase orders, invoices, financing agreements, and lease agreements for landscaping equipment.

Your task is to extract equipment information from the uploaded document. Look for:
- Make (manufacturer/brand like John Deere, Kubota, Stihl, etc.)
- Model (model number/name)
- Year (model year if visible)
- Serial Number or VIN
- Purchase Date (invoice/order date)
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

Be thorough and extract ALL equipment items if the document contains multiple pieces of equipment.
If a field is not clearly visible in the document, set it to null.
Set confidence to "high" if the data is clearly legible, "medium" if somewhat unclear, or "low" if you had to make assumptions.

ATTACHMENT DETECTION:
Additionally, identify items that appear to be attachments or accessories rather than primary equipment:
- Buckets, forks, blades, augers, trenchers, grapples, pallet forks, etc.
- Items with significantly lower value than the main equipment on the same document
- Items that share financing terms with a larger piece of equipment (same monthly payment line)
- Items described as "includes", "with", or "accessory" relative to the main equipment
- Implements, quick-attach accessories, or add-ons

For each item, set:
- suggestedType: "equipment" for primary machines (loaders, excavators, trucks, mowers), "attachment" for accessories/implements
- suggestedParentIndex: If this is an attachment, the 0-based index of the likely parent equipment in this extraction, or null if uncertain`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_equipment",
              description: "Extract equipment data from the document",
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
                        notes: { type: ["string", "null"], description: "Any additional notes about this item" },
                        suggestedType: {
                          type: "string",
                          enum: ["equipment", "attachment"],
                          description: "Whether this is primary equipment or an attachment/accessory"
                        },
                        suggestedParentIndex: {
                          type: ["number", "null"],
                          description: "For attachments, the 0-based index of the parent equipment in this extraction"
                        }
                      },
                      required: ["make", "model", "confidence", "suggestedType"]
                    }
                  }
                },
                required: ["equipment"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_equipment" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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
    if (!toolCall || toolCall.function.name !== "extract_equipment") {
      throw new Error("No equipment data extracted from document");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const equipment: ExtractedEquipment[] = extractedData.equipment || [];

    console.log(`Extracted ${equipment.length} equipment items`);

    return new Response(JSON.stringify({ 
      success: true, 
      equipment,
      fileName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-equipment-docs function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
