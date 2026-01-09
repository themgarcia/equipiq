import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for each plan
const PRICE_IDS = {
  professional: {
    monthly: "price_1Snit7LkRHmmpEeH049tGqYY",
    annual: "price_1SnitTLkRHmmpEeHdjJlgvUg",
  },
  business: {
    monthly: "price_1SniteLkRHmmpEeHCLYoPdGb",
    annual: "price_1SnitpLkRHmmpEeHPA3KAfYe",
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { plan, interval } = await req.json();
    logStep("Request body parsed", { plan, interval });

    if (!plan || !["professional", "business"].includes(plan)) {
      throw new Error("Invalid plan. Must be 'professional' or 'business'");
    }
    if (!interval || !["monthly", "annual"].includes(interval)) {
      throw new Error("Invalid interval. Must be 'monthly' or 'annual'");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS][interval as "monthly" | "annual"];
    logStep("Price ID selected", { priceId });

    const origin = req.headers.get("origin") || "https://lovable.dev";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/settings/billing?success=true`,
      cancel_url: `${origin}/settings/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan,
        interval,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
