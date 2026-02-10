import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Full v3 taxonomy — 92 categories
const V3_CATEGORIES = [
  "Construction — Attachment",
  "Construction — Compactor — Plate/Rammer",
  "Construction — Compactor — Roller",
  "Construction — Concrete Mixer — Towable",
  "Construction — Concrete Vibrator",
  "Construction — Excavator — Compact",
  "Construction — Excavator — Mini",
  "Construction — Excavator — Standard",
  "Construction — Backhoe Loader",
  "Construction — Compact Track Loader (CTL)",
  "Construction — Compact Utility (Stand-On)",
  "Construction — Loader — Skid Steer",
  "Construction — Loader — Telehandler",
  "Construction — Loader — Wheel Compact",
  "Construction — Other",
  "Construction — Saw — Cutoff/Demo",
  "Construction — Saw — Masonry/Tile",
  "Construction — Saw — Walk-Behind",
  "Construction — Sweeper — Walk-Behind",
  "Construction — Tractor — Compact Utility",
  "Fleet — Other",
  "Fleet — Trailer — Dump",
  "Fleet — Trailer — Enclosed",
  "Fleet — Trailer — Equipment",
  "Fleet — Trailer — Landscape",
  "Fleet — Truck — Cab Over",
  "Fleet — Truck — Crew Cab 1/2 Ton",
  "Fleet — Truck — Crew Cab 3/4 Ton",
  "Fleet — Truck — Crew Cab 1 Ton",
  "Fleet — Truck — Dump Single Axle",
  "Fleet — Truck — Dump Tandem",
  "Fleet — Truck — Flatbed/Stake",
  "Fleet — UTV",
  "Fleet — Van — Cargo",
  "Fleet — Van — Passenger",
  "Irrigation — Other",
  "Irrigation — Trencher — Ride-On",
  "Irrigation — Trencher — Walk-Behind",
  "Irrigation — Underground — Directional Drill",
  "Irrigation — Underground — Vibratory Plow",
  "Lawn — Aerator — Ride-On",
  "Lawn — Aerator — Towable",
  "Lawn — Aerator — Walk-Behind",
  "Lawn — Blower — Backpack",
  "Lawn — Blower — Wheeled",
  "Lawn — Debris Loader — Truck Mount",
  "Lawn — Dethatcher — Walk-Behind",
  "Lawn — Edger — Bed Redefiner",
  "Lawn — Edger — Stick",
  "Lawn — Hedge Trimmer — Extended Reach",
  "Lawn — Hedge Trimmer — Standard",
  "Lawn — Mower — Brush/Front Mount",
  "Lawn — Mower — Robotic Commercial",
  "Lawn — Mower — Stand-On",
  "Lawn — Mower — Walk-Behind 21\"",
  "Lawn — Mower — Walk-Behind 32\"+",
  "Lawn — Mower — Wide Area",
  "Lawn — Mower — Zero Turn",
  "Lawn — Other",
  "Lawn — Overseeder",
  "Lawn — Sod Cutter",
  "Lawn — Spreader — Broadcast Push",
  "Lawn — Spreader — Ride-On Applicator",
  "Lawn — Sprayer — Backpack",
  "Lawn — Sprayer — Pull-Behind/Skid",
  "Lawn — Sprayer — Ride-On",
  "Lawn — Trimmer",
  "Shop — Compressor",
  "Shop — Generator — Portable",
  "Shop — Generator — Towable",
  "Shop — Light Tower",
  "Shop — Other",
  "Shop — Pressure Washer",
  "Shop — Pump",
  "Shop — Welder — Portable",
  "Snow — Attachment",
  "Snow — Blower — Walk-Behind",
  "Snow — Brine/Liquid Sprayer",
  "Snow — Other",
  "Snow — Plow — Blade",
  "Snow — Plow — Box/Wing",
  "Snow — Sidewalk Machine",
  "Snow — Spreader — Drop",
  "Snow — Spreader — Hopper (V-Box)",
  "Snow — Spreader — Tailgate",
  "Snow — Spreader — Walk-Behind",
  "Tree — Chainsaw",
  "Tree — Chipper — Brush 6\"",
  "Tree — Chipper — Brush 12\"+",
  "Tree — Log Splitter",
  "Tree — Other",
  "Tree — Stump Grinder",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to verify the caller
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Service role client for cross-user operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find all equipment with non-v3 categories
    const { data: equipment, error: eqError } = await adminClient
      .from("equipment")
      .select("id, name, category, make, model, year")
      .not("category", "in", `(${V3_CATEGORIES.map((c) => `"${c}"`).join(",")})`);

    if (eqError) throw eqError;

    if (!equipment || equipment.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No items need migration", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${equipment.length} items needing category migration`);

    // Call Lovable AI with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const itemsList = equipment
      .map((e) => `- ID: ${e.id} | Old Category: "${e.category}" | Name: "${e.name}" | Make: ${e.make} | Model: ${e.model} | Year: ${e.year}`)
      .join("\n");

    const systemPrompt = `You are an equipment classification expert for the landscape contracting industry. You must assign each equipment item to the single best category from the provided taxonomy. Use the make, model, year, and old category name to determine the best fit. Be precise — pick the most specific matching category, not a generic "Other" unless nothing else fits.`;

    const userPrompt = `Here is the v3 equipment taxonomy (92 categories):

${V3_CATEGORIES.join("\n")}

Here are the equipment items that need to be migrated from old categories to the v3 taxonomy:

${itemsList}

For each item, pick the single best v3 category. Call the assign_categories function with your assignments.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assign_categories",
              description: "Assign new v3 categories to equipment items",
              parameters: {
                type: "object",
                properties: {
                  assignments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Equipment UUID" },
                        newCategory: { type: "string", description: "The v3 category name" },
                      },
                      required: ["id", "newCategory"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["assignments"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assign_categories" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a minute." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured output");

    const { assignments } = JSON.parse(toolCall.function.arguments);
    if (!assignments || !Array.isArray(assignments)) throw new Error("Invalid AI response format");

    console.log(`AI returned ${assignments.length} category assignments`);

    // Validate all categories are in v3 list
    const validAssignments = assignments.filter((a: { id: string; newCategory: string }) =>
      V3_CATEGORIES.includes(a.newCategory)
    );
    const invalidCount = assignments.length - validAssignments.length;
    if (invalidCount > 0) {
      console.warn(`${invalidCount} assignments had invalid categories and were skipped`);
    }

    // Build results array and update DB
    const results: Array<{ id: string; name: string; oldCategory: string; newCategory: string }> = [];

    for (const assignment of validAssignments) {
      const item = equipment.find((e) => e.id === assignment.id);
      if (!item) continue;

      const { error: updateError } = await adminClient
        .from("equipment")
        .update({ category: assignment.newCategory })
        .eq("id", assignment.id);

      if (updateError) {
        console.error(`Failed to update ${assignment.id}:`, updateError.message);
        continue;
      }

      results.push({
        id: item.id,
        name: item.name,
        oldCategory: item.category,
        newCategory: assignment.newCategory,
      });
    }

    console.log(`Successfully migrated ${results.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migrated ${results.length} of ${equipment.length} items`,
        results,
        skipped: invalidCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("migrate-categories error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
