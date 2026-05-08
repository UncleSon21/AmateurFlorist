// supabase/functions/submit-wedding-enquiry/index.ts
//
// Receives a wedding-enquiry form POST from weddings.html, sends an email
// to the owner via Resend, and returns 200 OK on success.
//
// Required secrets (set with: supabase secrets set KEY=value):
//   RESEND_API_KEY  — Resend API key
//   FROM_EMAIL      — verified sender (e.g. enquiries@vaniaflorist.com.au)
//   OWNER_EMAIL     — where to deliver the enquiry
//
// Optional:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — if set, the enquiry is also
//   written to a `wedding_enquiries` table for record-keeping.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     || "onboarding@resend.dev";
const OWNER_EMAIL    = Deno.env.get("OWNER_EMAIL")    || "";

const SUPABASE_URL                = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SAVE_TO_DB = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

type Enquiry = {
  name?: string;
  partnerName?: string;
  email?: string;
  phone?: string;
  weddingDate?: string;
  venue?: string;
  guestCount?: string;
  style?: string;
  message?: string;
};

function escape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildEnquiryEmail(e: Enquiry): string {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:8px 14px 8px 0;color:#6b5d54;font-size:12px;letter-spacing:1px;text-transform:uppercase;vertical-align:top">${escape(label)}</td><td style="padding:8px 0;color:#1e1a17">${escape(value)}</td></tr>`
      : "";

  return `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:24px;background:#faf8f4;color:#1e1a17">
      <h1 style="font-size:1.6rem;font-weight:300;color:#1c3656;margin:0 0 8px 0">New wedding enquiry</h1>
      <p style="color:#6b5d54;margin:0 0 24px 0">From the Vaniaflorist website.</p>
      <table style="width:100%;border-collapse:collapse">
        ${row("Name",         e.name)}
        ${row("Partner",      e.partnerName)}
        ${row("Email",        e.email)}
        ${row("Phone",        e.phone)}
        ${row("Wedding date", e.weddingDate)}
        ${row("Venue",        e.venue)}
        ${row("Guest count",  e.guestCount)}
        ${row("Style",        e.style)}
      </table>
      ${e.message ? `
        <div style="margin-top:24px">
          <div style="color:#6b5d54;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Their vision</div>
          <div style="background:#fff;border:.5px solid rgba(28,22,18,.13);padding:14px 16px;border-radius:2px;line-height:1.6">${escape(e.message).replace(/\n/g, "<br>")}</div>
        </div>` : ""}
      <p style="color:#6b5d54;font-size:11px;margin-top:32px;border-top:.5px solid rgba(28,22,18,.13);padding-top:16px">
        Reply directly to this email to respond to the customer.
      </p>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing — email skipped");
    return;
  }
  const body: Record<string, any> = { from: FROM_EMAIL, to, subject, html };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("Resend failed:", await res.text());
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const data: Enquiry = await req.json();

    // Minimal validation
    if (!data.name || !data.email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Optional: persist to DB for record-keeping
    if (SAVE_TO_DB) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("wedding_enquiries").insert({
          name:         data.name,
          partner_name: data.partnerName ?? null,
          email:        data.email,
          phone:        data.phone ?? null,
          wedding_date: data.weddingDate ?? null,
          venue:        data.venue ?? null,
          guest_count:  data.guestCount ?? null,
          style:        data.style ?? null,
          message:      data.message ?? null,
        });
      } catch (e) {
        // Don't fail the whole request if the table doesn't exist yet
        console.warn("DB insert skipped:", e);
      }
    }

    // Notify owner
    if (OWNER_EMAIL) {
      await sendEmail(
        OWNER_EMAIL,
        `New wedding enquiry — ${data.name}${data.weddingDate ? ` (${data.weddingDate})` : ""}`,
        buildEnquiryEmail(data),
        data.email,
      );
    }

    // Auto-acknowledgment to customer
    const ack = `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:24px;background:#faf8f4;color:#1e1a17">
        <h1 style="font-size:1.6rem;font-weight:300;color:#1c3656;margin:0 0 12px 0">Thank you, ${escape(data.name)}.</h1>
        <p style="color:#1e1a17;line-height:1.65;margin:0 0 14px 0">
          Your wedding enquiry has reached us. We reply to every enquiry personally within 1–2 business days
          and will share next steps for your consultation.
        </p>
        <p style="color:#6b5d54;font-style:italic;margin:0">— The Vaniaflorist team</p>
      </div>
    `;
    await sendEmail(data.email, "We've received your wedding enquiry · Vaniaflorist", ack);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("submit-wedding-enquiry error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
