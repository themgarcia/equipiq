import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
};

type ActionType = keyof typeof RATE_LIMITS;

interface RateLimitRecord {
  id: string;
  identifier: string;
  action_type: string;
  attempts: number;
  first_attempt_at: string;
  blocked_until: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, success } = await req.json();

    if (!action || !RATE_LIMITS[action as ActionType]) {
      return new Response(
        JSON.stringify({ error: "Invalid action type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = RATE_LIMITS[action as ActionType];

    // Get client IP from headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";

    // Use email hash for password reset, IP for other actions
    let identifier: string;
    if (action === "password_reset" && email) {
      // Simple hash for email (in production, use a proper hash)
      identifier = `email:${btoa(email.toLowerCase())}`;
    } else {
      identifier = `ip:${clientIp}`;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If this is a success callback, clear the rate limit
    if (success === true) {
      await supabase
        .from("auth_rate_limits")
        .delete()
        .eq("identifier", identifier)
        .eq("action_type", action);

      return new Response(
        JSON.stringify({ allowed: true, cleared: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing rate limit record
    const { data: existingRecord } = await supabase
      .from("auth_rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("action_type", action)
      .single() as { data: RateLimitRecord | null };

    const now = new Date();

    // Check if currently blocked
    if (existingRecord?.blocked_until) {
      const blockedUntil = new Date(existingRecord.blocked_until);
      if (blockedUntil > now) {
        const retryAfterSeconds = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
        return new Response(
          JSON.stringify({
            allowed: false,
            blockedUntil: existingRecord.blocked_until,
            retryAfterSeconds,
            message: `Too many attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": retryAfterSeconds.toString(),
            } 
          }
        );
      }
    }

    // Check if window has expired - reset if so
    if (existingRecord) {
      const firstAttempt = new Date(existingRecord.first_attempt_at);
      const windowEnd = new Date(firstAttempt.getTime() + config.windowMinutes * 60 * 1000);
      
      if (now > windowEnd) {
        // Window expired, reset the record
        await supabase
          .from("auth_rate_limits")
          .delete()
          .eq("id", existingRecord.id);
        
        // Create new record
        await supabase
          .from("auth_rate_limits")
          .insert({
            identifier,
            action_type: action,
            attempts: 1,
            first_attempt_at: now.toISOString(),
          });

        return new Response(
          JSON.stringify({ 
            allowed: true, 
            attemptsRemaining: config.maxAttempts - 1,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Window still active - check attempts
      const newAttempts = existingRecord.attempts + 1;

      if (newAttempts > config.maxAttempts) {
        // Block the user
        const blockedUntil = new Date(now.getTime() + config.blockMinutes * 60 * 1000);
        
        await supabase
          .from("auth_rate_limits")
          .update({
            attempts: newAttempts,
            blocked_until: blockedUntil.toISOString(),
          })
          .eq("id", existingRecord.id);

        const retryAfterSeconds = config.blockMinutes * 60;
        return new Response(
          JSON.stringify({
            allowed: false,
            blockedUntil: blockedUntil.toISOString(),
            retryAfterSeconds,
            message: `Too many attempts. Please try again in ${config.blockMinutes} minutes.`,
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": retryAfterSeconds.toString(),
            } 
          }
        );
      }

      // Increment attempts
      await supabase
        .from("auth_rate_limits")
        .update({ attempts: newAttempts })
        .eq("id", existingRecord.id);

      const attemptsRemaining = config.maxAttempts - newAttempts;
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          attemptsRemaining,
          warning: attemptsRemaining <= 2 ? `Warning: ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before temporary lockout.` : undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No existing record - create one
    await supabase
      .from("auth_rate_limits")
      .insert({
        identifier,
        action_type: action,
        attempts: 1,
        first_attempt_at: now.toISOString(),
      });

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        attemptsRemaining: config.maxAttempts - 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request to proceed (fail open for availability)
    return new Response(
      JSON.stringify({ allowed: true, error: "Rate limit check failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
