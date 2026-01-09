import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Product IDs mapped to plans
const PRODUCT_TO_PLAN: Record<string, "professional" | "business"> = {
  "prod_TlFN734QqzGQ6d": "professional",
  "prod_TlFO5rYhv7ISWt": "professional",
  "prod_TlFOF61mdEQlkf": "business",
  "prod_TlFOMNvB2yCV6x": "business",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errorMessage });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
      logStep("Processing event without signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        if (session.mode === "subscription" && session.subscription && session.metadata?.user_id) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0].price.product as string;
          const plan = PRODUCT_TO_PLAN[productId] || "professional";
          const priceInterval = subscription.items.data[0].price.recurring?.interval;
          const billingInterval = priceInterval === "year" ? "annual" : "monthly";

          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: session.metadata.user_id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              billing_interval: billingInterval,
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              grace_period_ends_at: null,
              canceled_at: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          logStep("Subscription record created/updated", { userId: session.metadata.user_id, plan });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          const { data: subRecord } = await supabaseClient
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", invoice.subscription)
            .maybeSingle();

          if (subRecord) {
            await supabaseClient
              .from("subscriptions")
              .update({
                status: "active",
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", invoice.subscription);

            logStep("Subscription renewed", { subscriptionId: invoice.subscription });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabaseClient
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription);

          logStep("Payment failed, marked past_due", { subscriptionId: invoice.subscription });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Set 7-day grace period
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

        await supabaseClient
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            grace_period_ends_at: gracePeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        logStep("Subscription canceled, grace period set", { 
          subscriptionId: subscription.id,
          gracePeriodEnds: gracePeriodEnd.toISOString() 
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const productId = subscription.items.data[0].price.product as string;
        const plan = PRODUCT_TO_PLAN[productId] || "professional";
        const priceInterval = subscription.items.data[0].price.recurring?.interval;
        const billingInterval = priceInterval === "year" ? "annual" : "monthly";

        await supabaseClient
          .from("subscriptions")
          .update({
            plan,
            billing_interval: billingInterval,
            status: subscription.status === "active" ? "active" : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        logStep("Subscription updated", { subscriptionId: subscription.id, plan, billingInterval });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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
