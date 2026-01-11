import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the deletion request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("account_deletion_requests")
      .select("*")
      .eq("token", token)
      .is("confirmed_at", null)
      .single();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired deletion request" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(request.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This deletion link has expired. Please request a new one." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = request.user_id;
    console.log(`Processing confirmed account deletion for user: ${userId}`);

    // Mark request as confirmed
    await supabaseAdmin
      .from("account_deletion_requests")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", request.id);

    // Delete all user data in order (child tables first)
    const tablesToDelete = [
      "equipment_documents",
      "equipment_attachments",
      "insurance_change_log",
      "metered_usage",
      "usage_tracking",
      "user_notifications",
      "feedback_replies",
      "feedback",
      "email_preferences",
      "insurance_settings",
      "equipment",
      "subscriptions",
      "user_roles",
      "account_deletion_requests",
      "profiles",
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("user_id", userId);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      } else {
        console.log(`Deleted from ${table}`);
      }
    }

    // Delete user's files from storage
    const { data: userFiles } = await supabaseAdmin
      .storage
      .from("equipment-documents")
      .list(userId);

    if (userFiles && userFiles.length > 0) {
      const filePaths = userFiles.map((file) => `${userId}/${file.name}`);
      await supabaseAdmin.storage.from("equipment-documents").remove(filePaths);
      console.log(`Deleted ${filePaths.length} files from storage`);
    }

    // Delete the user from auth.users
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted user account: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in confirm-account-deletion:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
