import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Resend client for email notifications
const RESEND_BASE_URL = "https://api.resend.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "escrow_created" | "escrow_funded" | "escrow_released" | "escrow_refunded" | "message_received" | "deadline_approaching" | "release_pending";
  escrow_id: string;
  recipient_email?: string;
  recipient_address: string;
  data?: Record<string, unknown>;
}

const EMAIL_TEMPLATES = {
  escrow_created: {
    subject: "New Escrow Created - {{amount}} ₳",
    html: `
      <h1>New Escrow Created</h1>
      <p>An escrow for <strong>{{amount}} ₳</strong> has been created.</p>
      <p>Deadline: {{deadline}}</p>
      <p><a href="{{escrow_url}}">View Escrow Details</a></p>
    `,
  },
  escrow_funded: {
    subject: "Escrow Funded - {{amount}} ₳",
    html: `
      <h1>Escrow Has Been Funded</h1>
      <p><strong>{{amount}} ₳</strong> has been locked in escrow.</p>
      <p><a href="{{escrow_url}}">View Escrow Details</a></p>
    `,
  },
  escrow_released: {
    subject: "Funds Released - {{amount}} ₳",
    html: `
      <h1>Funds Have Been Released</h1>
      <p><strong>{{amount}} ₳</strong> has been released to the seller.</p>
      <p><a href="{{escrow_url}}">View Transaction Details</a></p>
    `,
  },
  escrow_refunded: {
    subject: "Escrow Refunded - {{amount}} ₳",
    html: `
      <h1>Escrow Has Been Refunded</h1>
      <p><strong>{{amount}} ₳</strong> has been refunded to the buyer.</p>
      <p><a href="{{escrow_url}}">View Transaction Details</a></p>
    `,
  },
  message_received: {
    subject: "New Message in Escrow",
    html: `
      <h1>New Message Received</h1>
      <p>You have a new message in your escrow for <strong>{{amount}} ₳</strong>.</p>
      <p><a href="{{escrow_url}}">View Conversation</a></p>
    `,
  },
  deadline_approaching: {
    subject: "⚠️ Escrow Deadline Approaching",
    html: `
      <h1>Deadline Alert</h1>
      <p>Your escrow for <strong>{{amount}} ₳</strong> expires in <strong>{{time_remaining}}</strong>.</p>
      <p><a href="{{escrow_url}}">Take Action Now</a></p>
    `,
  },
  release_pending: {
    subject: "🔐 Co-signature Required - {{amount}} ₳ Escrow Release",
    html: `
      <h1>Co-signature Required</h1>
      <p>The buyer has initiated the release of <strong>{{amount}} ₳</strong> from escrow.</p>
      <p>Your co-signature is needed to complete the transaction and receive the funds.</p>
      <p><a href="{{escrow_url}}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Review & Co-sign</a></p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">If you did not expect this, please contact the buyer.</p>
    `,
  },
};

function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, escrow_id, recipient_email, recipient_address, data = {} }: NotificationRequest = await req.json();

    if (!type || !escrow_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, escrow_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrow_id)
      .single();

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: "Escrow not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to find recipient email from profile
    let toEmail = recipient_email;
    if (!toEmail && recipient_address) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("wallet_address", recipient_address)
        .single();

      if (profile?.user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
        toEmail = authUser?.user?.email;
      }
    }

    if (!toEmail) {
      console.log("No email found for recipient, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No recipient email found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Unknown notification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare template data
    const amount = Number(escrow.amount) / 1_000_000;
    const templateData = {
      amount: amount.toLocaleString(),
      deadline: new Date(escrow.deadline).toLocaleDateString(),
      escrow_url: `${data.base_url || "https://trusty-deal-maker.lovable.app"}/escrow/${escrow_id}`,
      ...data,
    };

    // Send email using Resend REST API
    const emailPayload = {
      from: "CardanoEscrow <notifications@noreply.cardanoescrow.com>",
      to: [toEmail],
      subject: renderTemplate(template.subject, templateData),
      html: renderTemplate(template.html, templateData),
    };

    const emailResponse = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailResult)}`);
    }

    console.log("Email notification sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
