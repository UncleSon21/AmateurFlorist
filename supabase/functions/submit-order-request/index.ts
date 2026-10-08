// supabase/functions/submit-order-request/index.ts
//
// Receives an order from checkout.html while online payment isn't open,
// re-prices it from the products table (never trusting the browser's prices),
// saves it to `order_requests` (004_order_requests.sql), emails it to the
// owner and, if the customer gave an email, sends them a copy.
// No payment is taken: the owner contacts the customer to confirm.
//
// Self-contained (no shared imports) so it can be pasted into the Supabase
// dashboard editor.
//
// Secrets (shared with submit-wedding-enquiry):
//   RESEND_API_KEY, FROM_EMAIL (bare address), OWNER_EMAIL
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Succeeds only if the order landed somewhere durable (the table or the
// owner's inbox); otherwise the customer sees an error and can email instead.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     || "onboarding@resend.dev";
const OWNER_EMAIL    = Deno.env.get("OWNER_EMAIL")    || "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// Must match checkout.ts and create-payment-intent.
const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50
const DELIVERY_FEE_CENTS            = 1500; // $15
const MAX_LINES = 20;
const MAX_QTY   = 50;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Line = {
  product_id: string; variant_code: string; qty: number;
  name: string; variant: string; unit_cents: number; line_cents: number;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escape(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function niceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-AU",
    { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Returns true only if Resend accepted the email. */
async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY missing — email skipped"); return false; }
  const body: Record<string, unknown> = { from: `Amateur Florist <${FROM_EMAIL}>`, to, subject, html };
  if (replyTo) body.reply_to = replyTo;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { console.error("Resend failed:", await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("Resend request error:", e);
    return false;
  }
}

function itemsTable(lines: Line[], subtotal: number, delivery: number, total: number, pickup: boolean): string {
  const rows = lines.map(l => `
    <tr>
      <td style="padding:8px 0;border-bottom:.5px solid rgba(28,22,18,.13)">${escape(l.name)}${l.variant ? ` <span style="color:#6b5d54">(${escape(l.variant)})</span>` : ""} × ${l.qty}</td>
      <td style="padding:8px 0;border-bottom:.5px solid rgba(28,22,18,.13);text-align:right">${money(l.line_cents)}</td>
    </tr>`).join("");
  const sum = (label: string, value: string, bold = false) => `
    <tr><td style="padding:6px 0;color:#6b5d54${bold ? ";font-weight:600;color:#1e1a17" : ""}">${label}</td>
        <td style="padding:6px 0;text-align:right${bold ? ";font-weight:600" : ""}">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
    ${rows}
    ${sum("Subtotal", money(subtotal))}
    ${sum(pickup ? "Pickup" : "Delivery", delivery === 0 ? "Free" : money(delivery))}
    ${sum("Total", money(total), true)}
  </table>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  const name     = str(body.customer_name, 120);
  const phone    = str(body.customer_phone, 40);
  const email    = str(body.customer_email, 200).toLowerCase();
  const date     = str(body.delivery_date, 10);
  const time     = str(body.delivery_time, 60);
  const pickup   = body.is_pickup === true;
  const notes    = str(body.notes, 400);
  const address  = pickup ? "" : [body.street, body.suburb, body.state, body.postcode]
    .map(v => str(v, 120)).filter(Boolean).join(", ");
  const items: any[] = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : [];

  if (name.length < 2 || !/^[\d\s+\-()]{8,}$/.test(phone) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !items.length) {
    return json({ error: "Please fill in your name, mobile and date." }, 400);
  }
  // Today in Sydney as YYYY-MM-DD (en-CA formats dates that way).
  const sydneyToday = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  if (date < sydneyToday) {
    return json({ error: "Please choose a date from today onwards." }, 400);
  }
  if (!pickup && (str(body.street).length < 5 || str(body.suburb).length < 2)) {
    return json({ error: "Please fill in the delivery address." }, 400);
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "That email address doesn't look right." }, 400);
  }

  // ─── Prices from the database, not the browser ───
  const lines: Line[] = [];
  for (const it of items) {
    const qty = Math.trunc(Number(it?.qty));
    if (!(qty >= 1 && qty <= MAX_QTY)) return json({ error: "Please check the quantities in your cart." }, 400);
    const { data: p, error } = await supabase
      .from("products")
      .select("id, name, variants ( variant_code, name, price_cents ), product_add_ons ( add_ons ( id, name, price_cents ) )")
      .eq("id", str(it?.product_id, 60))
      .single();
    if (error || !p) return json({ error: "An item in your cart is no longer available." }, 400);
    const variant = (p.variants || []).find((v: any) => v.variant_code === it?.variant_code) || (p.variants || [])[0];
    if (!variant) return json({ error: "An item in your cart is no longer available." }, 400);
    let unit = variant.price_cents;
    const addOnNames: string[] = [];
    for (const id of Array.isArray(it?.add_on_ids) ? it.add_on_ids : []) {
      const ao = (p.product_add_ons || []).map((pa: any) => pa.add_ons).find((a: any) => a && String(a.id) === String(id));
      if (ao) { unit += ao.price_cents; addOnNames.push(ao.name); }
    }
    lines.push({
      product_id: p.id, variant_code: variant.variant_code, qty,
      name: p.name, variant: [variant.name, ...addOnNames].filter(Boolean).join(" + "),
      unit_cents: unit, line_cents: unit * qty,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.line_cents, 0);
  const delivery = pickup || subtotal >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
  const total    = subtotal + delivery;

  // ─── Save ───
  let ref = "";
  const { data: saved, error: saveErr } = await supabase.from("order_requests").insert({
    customer_name: name, customer_phone: phone, customer_email: email || null,
    is_pickup: pickup, delivery_date: date, delivery_time: time || null,
    address: address || null, notes: notes || null,
    items: lines, subtotal_cents: subtotal, delivery_cents: delivery, total_cents: total,
  }).select("ref").single();
  if (saveErr) console.error("order_requests insert failed:", saveErr);
  else ref = saved.ref;

  // ─── Email the owner ───
  const row = (label: string, value: string) => value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#6b5d54;font-size:12px;letter-spacing:1px;text-transform:uppercase;vertical-align:top">${escape(label)}</td><td style="padding:6px 0;color:#1e1a17">${escape(value).replace(/\n/g, "<br>")}</td></tr>`
    : "";
  const ownerHtml = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;background:#faf8f4;color:#1e1a17">
      <h1 style="font-size:1.5rem;font-weight:300;margin:0 0 6px">New order request${ref ? ` · ${escape(ref)}` : ""}</h1>
      <p style="color:#6b5d54;margin:0 0 20px">Not paid. Contact them to confirm, and take the $10 deposit by PayID.</p>
      ${itemsTable(lines, subtotal, delivery, total, pickup)}
      <table style="width:100%;border-collapse:collapse;margin-top:20px;font-family:Arial,sans-serif;font-size:14px">
        ${row("Name", name)}
        ${row("Mobile", phone)}
        ${row("Email", email)}
        ${row(pickup ? "Pickup date" : "Delivery date", niceDate(date))}
        ${row("Preferred time", time)}
        ${row(pickup ? "Pickup" : "Deliver to", pickup ? "Customer will pick up" : address)}
        ${row("Card message / notes", notes)}
      </table>
      ${email ? `<p style="color:#6b5d54;font-size:12px;margin-top:24px">Reply to this email to reach the customer.</p>` : ""}
    </div>`;
  const notified = OWNER_EMAIL
    ? await sendEmail(OWNER_EMAIL, `New order request — ${name} (${niceDate(date)})${ref ? ` · ${ref}` : ""}`, ownerHtml, email || undefined)
    : false;

  if (!ref && !notified) {
    console.error("Order neither saved nor emailed — returning 500 so checkout offers email instead");
    return json({ error: "We couldn't send your order. Please email it to us instead." }, 500);
  }

  // ─── Copy to the customer ───
  if (email) {
    const customerHtml = `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;background:#faf8f4;color:#1e1a17">
        <h1 style="font-size:1.5rem;font-weight:300;margin:0 0 12px">Thank you, ${escape(name)}.</h1>
        <p style="line-height:1.65;margin:0 0 16px">We've received your order request${ref ? ` <strong>${escape(ref)}</strong>` : ""}.
          Nothing is charged yet. We'll contact you on ${escape(phone)} to confirm it, and a $10 deposit by
          PayID secures your order. You pay the rest once you've seen your bouquet and you're happy with it.</p>
        ${itemsTable(lines, subtotal, delivery, total, pickup)}
        <p style="line-height:1.65;margin:20px 0 0">${pickup ? "Pickup" : "Delivery"}: ${escape(niceDate(date))}${time ? `, ${escape(time)}` : ""}${pickup ? "" : `<br>To: ${escape(address)}`}</p>
        <p style="color:#6b5d54;font-size:13px;margin-top:24px">Questions? Just reply to this email.</p>
        <p style="color:#6b5d54;font-style:italic;margin:16px 0 0">— Amateur Florist</p>
      </div>`;
    // No reply_to: replies go to FROM_EMAIL (the public address), never to the
    // owner's personal inbox address in OWNER_EMAIL.
    await sendEmail(email, `Your order request${ref ? ` ${ref}` : ""} · Amateur Florist`, customerHtml);
  }

  return json({ ok: true, ref, total_cents: total });
});
