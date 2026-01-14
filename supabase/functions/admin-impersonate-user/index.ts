import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImpersonateRequest {
  targetUserId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is an admin using RPC
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetUserId, reason }: ImpersonateRequest = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "targetUserId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent impersonating yourself
    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot impersonate yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user's email using service role
    const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(targetUserId);

    if (targetError || !targetUser?.user) {
      return new Response(
        JSON.stringify({ error: "Target user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetEmail = targetUser.user.email;
    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: "Target user has no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for the target user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
    });

    if (linkError || !linkData) {
      console.error("Failed to generate magic link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate impersonation link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the impersonation session
    const { data: session, error: sessionError } = await adminClient
      .from("impersonation_sessions")
      .insert({
        admin_user_id: user.id,
        impersonated_user_id: targetUserId,
        reason: reason || null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Failed to log impersonation session:", sessionError);
      // Continue anyway - we don't want to block impersonation if logging fails
    }

    // Log to admin activity log
    await adminClient.from("admin_activity_log").insert({
      action_type: "impersonation_started",
      target_user_id: targetUserId,
      target_user_email: targetEmail,
      performed_by_user_id: user.id,
      performed_by_email: user.email || "Unknown",
      details: {
        reason: reason || null,
        session_id: session?.id || null,
      },
    });

    // Return the token properties needed for client-side verification
    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties.hashed_token,
        email: targetEmail,
        session_id: session?.id || null,
        target_user: {
          id: targetUserId,
          email: targetEmail,
          full_name: targetUser.user.user_metadata?.full_name || targetEmail,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Impersonation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
