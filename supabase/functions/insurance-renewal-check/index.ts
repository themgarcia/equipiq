import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "EquipIQ <noreply@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  return res.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all insurance settings with renewal dates
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('insurance_settings')
      .select('*, profiles:user_id(full_name, company_name)')
      .not('policy_renewal_date', 'is', null);

    if (settingsError) {
      throw settingsError;
    }

    const results = {
      preRenewalNotifications: 0,
      postRenewalNotifications: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    for (const setting of settings || []) {
      const renewalDate = new Date(setting.policy_renewal_date);
      const reminderDays = setting.renewal_reminder_days || 60;
      const reminderDate = new Date(renewalDate.getTime() - reminderDays * 24 * 60 * 60 * 1000);
      const postRenewalDate = new Date(renewalDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get user email for notifications
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(setting.user_id);
      const userEmail = userData?.user?.email;

      // Check for email preference
      const { data: emailPrefs } = await supabaseAdmin
        .from('email_preferences')
        .select('insurance_renewal_reminders')
        .eq('user_id', setting.user_id)
        .single();

      const emailEnabled = emailPrefs?.insurance_renewal_reminders !== false;

      // Pre-renewal check (X days before renewal)
      if (
        today >= reminderDate &&
        today < renewalDate &&
        (!setting.last_pre_renewal_reminder_at || setting.last_pre_renewal_reminder_at < sevenDaysAgo)
      ) {
        // Create notification
        const { error: notifError } = await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: setting.user_id,
            type: 'insurance_renewal',
            title: 'Insurance Renewal Approaching',
            message: `Your insurance policy renews in ${Math.ceil((renewalDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))} days. Review your insured equipment list and communicate any changes to your broker.`,
            reference_type: 'insurance',
          });

        if (notifError) {
          results.errors.push(`Failed to create pre-renewal notification for user ${setting.user_id}`);
        } else {
          results.preRenewalNotifications++;
        }

        // Send email if enabled
        if (emailEnabled && userEmail) {
          try {
            await resend.emails.send({
              from: "EquipIQ <noreply@resend.dev>",
              to: [userEmail],
              subject: `Insurance Renewal Reminder - ${setting.profiles?.company_name || 'Your Policy'}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1a1a1a;">Insurance Renewal Approaching</h2>
                  <p>Hi ${setting.profiles?.full_name || 'there'},</p>
                  <p>Your insurance policy renews on <strong>${renewalDate.toLocaleDateString()}</strong> (${Math.ceil((renewalDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))} days from now).</p>
                  <p>Before your renewal:</p>
                  <ul>
                    <li>Review your insured equipment list</li>
                    <li>Communicate any pending changes to your broker</li>
                    <li>Verify your declared values are up to date</li>
                  </ul>
                  <p>Log in to EquipIQ to manage your Insurance Control.</p>
                  <p>Best regards,<br>The EquipIQ Team</p>
                </div>
              `,
            });
            results.emailsSent++;
          } catch (emailError) {
            results.errors.push(`Failed to send pre-renewal email to ${userEmail}`);
          }
        }

        // Update last reminder timestamp
        await supabaseAdmin
          .from('insurance_settings')
          .update({ last_pre_renewal_reminder_at: today.toISOString() })
          .eq('id', setting.id);
      }

      // Post-renewal "Close the Loop" check (30 days after renewal)
      if (
        today >= postRenewalDate &&
        (!setting.renewal_confirmed_at || new Date(setting.renewal_confirmed_at) < renewalDate) &&
        (!setting.last_post_renewal_reminder_at || setting.last_post_renewal_reminder_at < sevenDaysAgo)
      ) {
        // Create notification
        const { error: notifError } = await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: setting.user_id,
            type: 'insurance_renewal',
            title: 'Close the Loop on Your Insurance',
            message: `Your policy renewed 30 days ago. Please confirm your broker completed all changes and update any policy details.`,
            reference_type: 'insurance',
          });

        if (notifError) {
          results.errors.push(`Failed to create post-renewal notification for user ${setting.user_id}`);
        } else {
          results.postRenewalNotifications++;
        }

        // Send email if enabled
        if (emailEnabled && userEmail) {
          try {
            await resend.emails.send({
              from: "EquipIQ <noreply@resend.dev>",
              to: [userEmail],
              subject: `Close the Loop - Insurance Renewal Confirmation`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1a1a1a;">Time to Close the Loop</h2>
                  <p>Hi ${setting.profiles?.full_name || 'there'},</p>
                  <p>It's been 30 days since your insurance policy renewed on ${renewalDate.toLocaleDateString()}.</p>
                  <p>Please take a moment to:</p>
                  <ul>
                    <li>Confirm your broker processed all equipment changes</li>
                    <li>Update your policy number if it changed</li>
                    <li>Update broker contact details if you switched brokers</li>
                    <li>Review any equipment added or sold since renewal</li>
                  </ul>
                  <p>Log in to EquipIQ and visit Insurance Control to close the loop.</p>
                  <p>Best regards,<br>The EquipIQ Team</p>
                </div>
              `,
            });
            results.emailsSent++;
          } catch (emailError) {
            results.errors.push(`Failed to send post-renewal email to ${userEmail}`);
          }
        }

        // Update last reminder timestamp
        await supabaseAdmin
          .from('insurance_settings')
          .update({ last_post_renewal_reminder_at: today.toISOString() })
          .eq('id', setting.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in insurance-renewal-check function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
