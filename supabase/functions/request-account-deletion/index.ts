import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const { baseUrl } = await req.json();
    if (!baseUrl || typeof baseUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid request: baseUrl required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate baseUrl is a valid URL
    try {
      new URL(baseUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid baseUrl format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete any existing pending requests for this user
    await supabaseAuth
      .from("account_deletion_requests")
      .delete()
      .eq("user_id", user.id)
      .is("confirmed_at", null);

    // Create a new deletion request
    const { data: request, error: insertError } = await supabaseAuth
      .from("account_deletion_requests")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (insertError || !request) {
      console.error("Error creating deletion request:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create deletion request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build confirmation URL
    const confirmUrl = `${baseUrl}/confirm-delete?token=${request.token}`;

    // Send confirmation email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "equipIQ <noreply@updates.equipiq.app>",
        to: [user.email!],
        subject: "Confirm Account Deletion - equipIQ",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #dc2626;">Account Deletion Request</h1>
  </div>
  
  <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin-top: 0;">We received a request to permanently delete your equipIQ account associated with this email address.</p>
    <p><strong>This action cannot be undone.</strong></p>
  </div>

  <div style="margin-bottom: 24px;">
    <p>All your data will be permanently deleted, including:</p>
    <ul style="padding-left: 20px;">
      <li>All equipment records and attachments</li>
      <li>All uploaded documents</li>
      <li>Insurance settings and history</li>
      <li>Your profile and preferences</li>
    </ul>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${confirmUrl}" style="display: inline-block; background-color: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Confirm Account Deletion</a>
  </div>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #64748b; font-size: 14px;">⏰ This link will expire in 24 hours.</p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
    <p>If you did not request this, please ignore this email. Your account will remain safe.</p>
    <p style="margin-bottom: 0;">— The equipIQ Team</p>
  </div>
</body>
</html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending deletion confirmation email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deletion confirmation email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmation email sent",
        expiresAt: request.expires_at 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in request-account-deletion:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
