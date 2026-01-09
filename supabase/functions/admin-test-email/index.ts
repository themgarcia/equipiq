import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  emailType: "welcome" | "password-reset";
}

const getWelcomeEmailHtml = (firstName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e3a5f; margin-bottom: 10px;">Welcome to equipIQ!</h1>
    <p style="color: #666; font-size: 16px;">Equipment intelligence for contractors</p>
  </div>
  
  <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #1e293b; margin-top: 0;">Hey ${firstName}! 👋</h2>
    <p>Thanks for joining the equipIQ open beta. You now have full access to all features at no cost during our beta period.</p>
  </div>

  <div style="margin-bottom: 24px;">
    <h3 style="color: #1e293b;">🚀 Quick Start Guide</h3>
    <ul style="padding-left: 20px;">
      <li><strong>Add your equipment</strong> – Start tracking your fleet by adding your first piece of equipment</li>
      <li><strong>Review category lifespans</strong> – Customize useful life estimates for your industry</li>
      <li><strong>Explore analytics</strong> – Check out depreciation, cash flow, and buy vs. rent analysis</li>
      <li><strong>Export reports</strong> – Generate insurance and FMS-ready reports</li>
    </ul>
  </div>

  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #92400e;"><strong>🎉 Open Beta Perk:</strong> All Business tier features are unlocked for you during the beta period!</p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="https://equipiq.app/dashboard" style="display: inline-block; background-color: #1e3a5f; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
    <p>Questions or feedback? We'd love to hear from you – just reply to this email or use the feedback form in the app.</p>
    <p style="margin-bottom: 0;">— The equipIQ Team</p>
  </div>

  <div style="margin-top: 20px; padding: 12px; background-color: #fef3c7; border-radius: 6px; text-align: center;">
    <p style="margin: 0; color: #92400e; font-size: 12px;"><strong>📧 TEST EMAIL</strong> - This is a test email sent from the Admin Dashboard</p>
  </div>
</body>
</html>
`;

const getPasswordResetEmailHtml = (firstName: string) => {
  const changeDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e3a5f; margin-bottom: 10px;">Password Changed</h1>
  </div>
  
  <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #1e293b; margin-top: 0;">Hey ${firstName}! 🔐</h2>
    <p>Your equipIQ password was successfully changed on <strong>${changeDate}</strong>.</p>
  </div>

  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #991b1b;"><strong>⚠️ Didn't make this change?</strong></p>
    <p style="margin: 8px 0 0 0; color: #991b1b;">If you didn't change your password, please secure your account immediately by resetting your password and contacting our support team.</p>
  </div>

  <div style="margin-bottom: 24px;">
    <h3 style="color: #1e293b;">🛡️ Security Tips</h3>
    <ul style="padding-left: 20px;">
      <li>Use a unique password that you don't use on other sites</li>
      <li>Consider using a password manager</li>
      <li>Enable two-factor authentication when available</li>
    </ul>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="https://equipiq.app/dashboard" style="display: inline-block; background-color: #1e3a5f; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
    <p>If you have any questions or concerns, please don't hesitate to reach out to us.</p>
    <p style="margin-bottom: 0;">— The equipIQ Team</p>
  </div>

  <div style="margin-top: 20px; padding: 12px; background-color: #fef3c7; border-radius: 6px; text-align: center;">
    <p style="margin: 0; color: #92400e; font-size: 12px;"><strong>📧 TEST EMAIL</strong> - This is a test email sent from the Admin Dashboard</p>
  </div>
</body>
</html>
`;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is an admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse the request body
    const { emailType }: TestEmailRequest = await req.json();

    if (!emailType || !["welcome", "password-reset"].includes(emailType)) {
      return new Response(
        JSON.stringify({ error: "Invalid email type. Must be 'welcome' or 'password-reset'" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the admin's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    const firstName = profile?.full_name?.split(' ')[0] || 'Admin';
    const adminEmail = user.email;

    if (!adminEmail) {
      return new Response(
        JSON.stringify({ error: "Admin email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare email content based on type
    let subject: string;
    let html: string;

    if (emailType === "welcome") {
      subject = "[TEST] Welcome to equipIQ! 🚜";
      html = getWelcomeEmailHtml(firstName);
    } else {
      subject = "[TEST] Your equipIQ Password Has Been Changed 🔐";
      html = getPasswordResetEmailHtml(firstName);
    }

    // Send the email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "equipIQ <noreply@updates.equipiq.app>",
        to: [adminEmail],
        subject,
        html,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending test email:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send email" }),
        { status: emailResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Test ${emailType} email sent to ${adminEmail}:`, result);

    return new Response(
      JSON.stringify({ success: true, data: result, sentTo: adminEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-test-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
