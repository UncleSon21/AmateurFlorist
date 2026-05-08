// supabase/functions/stripe-webhook/index.ts
// Handles Stripe's checkout.session.completed webhook.
// 1. Verifies the Stripe signature
// 2. Creates the order + items in Supabase
// 3. Sends confirmation emails via Resend
//
// Required env vars (set via: supabase secrets set KEY=value):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY      — optional; emails skipped if missing
//   FROM_EMAIL          — verified Resend sender (e.g. orders@vaniaflorist.com.au)
//   OWNER_EMAIL         — where order alerts go
//   TWILIO_*            — optional; SMS skipped if missing

import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Email config — pulled from env. Defaults are sandbox/test values that
// Resend won't deliver to anyone except the account owner.
const OWNER_EMAIL = Deno.env.get("OWNER_EMAIL") || "hungsonle2112@gmail.com";
const FROM_EMAIL  = Deno.env.get("FROM_EMAIL")  || "onboarding@resend.dev";

// Twilio (optional — SMS notifications)
const TWILIO_SID    = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
const TWILIO_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN")  || "";
const TWILIO_FROM   = Deno.env.get("TWILIO_FROM_NUMBER") || "";
const OWNER_PHONE   = Deno.env.get("OWNER_PHONE")        || "";
const TWILIO_CONFIGURED = !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM);

async function sendSMS(to: string, body: string) {
  if (!TWILIO_CONFIGURED || !to) return;
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body }).toString(),
      }
    );
    if (!res.ok) console.error("SMS failed:", await res.text());
  } catch (err) {
    console.error("SMS error:", err);
  }
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Send email via Resend ───
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Vania Florist <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    }
  } catch (e) {
    console.error("Email send failed:", e);
  }
}

// ─── Build customer confirmation email ───
function buildCustomerEmail(order: any, items: any[]): string {
  const itemRows = items.map((it: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;">${it.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:center;">${it.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:right;">${formatPrice(it.line_cents)}</td>
    </tr>
  `).join("");

  return `
    <div style="max-width:560px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#3d3d3a;">
      <div style="text-align:center;padding:32px 0 24px;">
        <h1 style="font-size:24px;margin:0;color:#8b6f6f;">Vania Florist</h1>
        <p style="color:#a08b7e;margin:4px 0 0;">Thank you for your order</p>
      </div>
      <div style="background:#faf8f5;border-radius:12px;padding:24px;margin-bottom:20px;">
        <p style="margin:0 0 16px;">Hi <strong>${order.customer_name}</strong>,</p>
        <p style="margin:0 0 16px;">We've received your order and your payment has been confirmed. Here's a summary:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f0ebe3;">
              <th style="padding:8px 12px;text-align:left;">Item</th>
              <th style="padding:8px 12px;text-align:center;">Qty</th>
              <th style="padding:8px 12px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px 12px;font-weight:bold;">Total</td>
              <td style="padding:8px 12px;text-align:right;font-weight:bold;">${formatPrice(order.total_cents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="background:#faf8f5;border-radius:12px;padding:24px;margin-bottom:20px;font-size:14px;">
        <p style="margin:0 0 8px;"><strong>Delivery date:</strong> ${formatDate(order.delivery_date)}</p>
        <p style="margin:0 0 8px;"><strong>Type:</strong> ${order.is_pickup ? "Pickup" : "Delivery"}</p>
        ${order.notes ? `<p style="margin:0;"><strong>Notes:</strong> ${order.notes}</p>` : ""}
      </div>
      <p style="font-size:13px;color:#a08b7e;text-align:center;">
        Questions? Just reply to this email or call us at 0414 827 927
      </p>
    </div>
  `;
}

// ─── Build owner alert email ───
function buildOwnerEmail(order: any, items: any[]): string {
  const itemList = items.map((it: any) =>
    `• ${it.product_name} (${it.variant_code}) × ${it.qty} — ${formatPrice(it.line_cents)}`
  ).join("<br>");

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#3d3d3a;">
      <h2 style="color:#8b6f6f;">New Order Received 🌸</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Customer:</strong> ${order.customer_name}</p>
      <p><strong>Phone:</strong> ${order.customer_phone}</p>
      ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ""}
      <p><strong>Delivery date:</strong> ${formatDate(order.delivery_date)}</p>
      <p><strong>Type:</strong> ${order.is_pickup ? "Pickup" : "Delivery"}</p>
      ${order.notes ? `<p><strong>Notes:</strong><br>${order.notes.replace(/\n/g, "<br>")}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e8e3dc;margin:16px 0;">
      <p><strong>Items:</strong></p>
      <p>${itemList}</p>
      <p style="font-size:18px;"><strong>Total: ${formatPrice(order.total_cents)}</strong></p>
    </div>
  `;
}

Deno.serve(async (req) => {
  try {
    // ─── Verify Stripe signature ───
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ─── Handle checkout.session.completed ───
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata!;

      // Parse order data from session metadata
      const orderItems = JSON.parse(meta.order_items);
      const totalCents = parseInt(meta.total_cents, 10);
      const isPickup = meta.is_pickup === "true";

      // ─── 1. Create order in Supabase ───
      const { data: order, error: e1 } = await supabase
        .from("orders")
        .insert([{
          customer_name: meta.customer_name,
          customer_phone: meta.customer_phone,
          customer_email: meta.customer_email || null,
          delivery_date: meta.delivery_date,
          notes: meta.notes || null,
          total_cents: totalCents,
          status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
        }])
        .select("id")
        .single();

      if (e1) {
        console.error("Failed to create order:", e1);
        return new Response("DB error", { status: 500 });
      }

      // ─── 2. Create order items ───
      const itemsForEmail: any[] = [];

      for (const it of orderItems) {
        // Fetch product name for email
        const { data: prod } = await supabase
          .from("products")
          .select("name")
          .eq("id", it.product_id)
          .single();

        const { data: oi, error: e2 } = await supabase
          .from("order_items")
          .insert([{
            order_id: order.id,
            product_id: it.product_id,
            variant_code: it.variant_code,
            qty: it.qty,
            line_cents: it.line_cents,
          }])
          .select("id")
          .single();

        if (e2) {
          console.error("Failed to create order item:", e2);
          continue;
        }

        // Insert add-on links
        if (it.add_on_ids?.length) {
          const rows = it.add_on_ids.map((aid: number) => ({
            order_item_id: oi.id,
            add_on_id: aid,
          }));
          await supabase.from("order_item_add_ons").insert(rows);
        }

        itemsForEmail.push({
          product_name: prod?.name || "Flower Arrangement",
          variant_code: it.variant_code,
          qty: it.qty,
          line_cents: it.line_cents,
        });
      }

      // ─── 3. Send emails via Resend ───
      const emailData = {
        id: order.id,
        customer_name: meta.customer_name,
        customer_phone: meta.customer_phone,
        customer_email: meta.customer_email,
        delivery_date: meta.delivery_date,
        notes: meta.notes,
        total_cents: totalCents,
        is_pickup: isPickup,
      };

      // Owner notification (always)
      await sendEmail(
        OWNER_EMAIL,
        `New Order from ${meta.customer_name} — ${formatPrice(totalCents)}`,
        buildOwnerEmail(emailData, itemsForEmail)
      );

      // Customer confirmation (if email provided)
      if (meta.customer_email) {
        await sendEmail(
          meta.customer_email,
          "Your Vania Florist Order Confirmation",
          buildCustomerEmail(emailData, itemsForEmail)
        );
      }

      // Optional SMS — only sends if Twilio env vars are set
      if (TWILIO_CONFIGURED) {
        if (OWNER_PHONE) {
          await sendSMS(
            OWNER_PHONE,
            `New order from ${meta.customer_name} — ${formatPrice(totalCents)}. Delivery: ${meta.delivery_date}. Call: ${meta.customer_phone}`
          );
        }
        if (meta.customer_phone) {
          await sendSMS(
            meta.customer_phone,
            `Hi ${meta.customer_name}! Your Vaniaflorist order is confirmed for ${meta.delivery_date}. Total: ${formatPrice(totalCents)}. We'll be in touch shortly.`
          );
        }
      }

      console.log(`Order ${order.id} created for session ${session.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});