import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendBrokerUpdateRequest {
  type: 'changes' | 'full_register';
  brokerEmail: string;
  brokerName?: string;
  subject: string;
  content: string;
  ccUserEmail?: string;
  changeIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: SendBrokerUpdateRequest = await req.json();
    const { type, brokerEmail, brokerName, subject, content, ccUserEmail, changeIds } = body;

    if (!brokerEmail || !subject || !content) {
      throw new Error("Missing required fields: brokerEmail, subject, content");
    }

    // Convert plain text to HTML (preserve line breaks)
    const htmlContent = content
      .split('\n')
      .map(line => line.trim() === '' ? '<br>' : `<p style="margin: 0 0 8px 0;">${line}</p>`)
      .join('');

    // Build email options with CC if user email provided
    const emailOptions: any = {
      from: "EquipIQ <noreply@resend.dev>",
      to: [brokerEmail],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlContent}
        </div>
      `,
    };

    // Always CC the user for delivery verification
    if (ccUserEmail) {
      emailOptions.cc = [ccUserEmail];
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailOptions),
    });
    const emailResponse = await emailRes.json();
    console.log("Email sent successfully:", emailResponse);

    // If this was a changes email, update the change log status to 'sent'
    if (type === 'changes' && changeIds && changeIds.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('insurance_change_log')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .in('id', changeIds)
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Failed to update change log status:", updateError);
        // Don't throw - email was still sent successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.id,
        ccTo: ccUserEmail || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-broker-update function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
