import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product IDs mapped to plans
const PRODUCT_TO_PLAN: Record<string, "professional" | "business"> = {
  "prod_TlFN734QqzGQ6d": "professional", // Professional Monthly
  "prod_TlFO5rYhv7ISWt": "professional", // Professional Annual
  "prod_TlFOF61mdEQlkf": "business",     // Business Monthly
  "prod_TlFOMNvB2yCV6x": "business",     // Business Annual
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning free plan");
      
      // Check for grace period in database
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const now = new Date();
      const inGracePeriod = subscription?.grace_period_ends_at 
        ? new Date(subscription.grace_period_ends_at) > now 
        : false;

      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        in_grace_period: inGracePeriod,
        grace_period_ends_at: subscription?.grace_period_ends_at || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for beta access in database
    const { data: dbSubscription } = await supabaseClient
      .from("subscriptions")
      .select("beta_access, beta_access_granted_at, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasBetaAccess = dbSubscription?.beta_access === true;
    logStep("Beta access check", { hasBetaAccess, grantedAt: dbSubscription?.beta_access_granted_at });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan: "free" | "professional" | "business" = "free";
    let subscriptionEnd: string | null = null;
    let billingInterval: "monthly" | "annual" | null = null;

    // If user has beta access but no active subscription, grant business tier
    if (!hasActiveSub && hasBetaAccess) {
      logStep("Granting business tier via beta access");
      return new Response(JSON.stringify({
        subscribed: false,
        plan: "business",
        beta_access: true,
        in_grace_period: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || "professional";
      
      const priceInterval = subscription.items.data[0].price.recurring?.interval;
      billingInterval = priceInterval === "year" ? "annual" : "monthly";
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        plan, 
        billingInterval,
        endDate: subscriptionEnd 
      });

      // Update subscription in database
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan,
          billing_interval: billingInterval,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          grace_period_ends_at: null,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    } else {
      logStep("No active subscription found");
      
      // Check for grace period
      const { data: dbSubscription } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const now = new Date();
      const inGracePeriod = dbSubscription?.grace_period_ends_at 
        ? new Date(dbSubscription.grace_period_ends_at) > now 
        : false;

      if (inGracePeriod && dbSubscription) {
        return new Response(JSON.stringify({
          subscribed: false,
          plan: dbSubscription.plan,
          in_grace_period: true,
          grace_period_ends_at: dbSubscription.grace_period_ends_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      billing_interval: billingInterval,
      subscription_end: subscriptionEnd,
      in_grace_period: false,
      beta_access: hasBetaAccess,
    }), {
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
