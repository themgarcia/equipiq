import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const firstName = fullName?.split(' ')[0] || 'there';

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "equipIQ <noreply@equipiq.app>",
        to: [email],
        subject: "Welcome to equipIQ! 🚜",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; margin-bottom: 10px;">Welcome to equipIQ!</h1>
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

  <div style="background-color: #ecfdf5; border-left: 4px solid #16a34a; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #166534;"><strong>🎉 Open Beta Perk:</strong> All Business tier features are unlocked for you during the beta period!</p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="https://equipiq.app/dashboard" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
    <p>Questions or feedback? We'd love to hear from you – just reply to this email or use the feedback form in the app.</p>
    <p style="margin-bottom: 0;">— The equipIQ Team</p>
  </div>
</body>
</html>
        `,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending welcome email:", result);
      return new Response(
        JSON.stringify({ error: result.message || "Failed to send email" }),
        { status: emailResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
