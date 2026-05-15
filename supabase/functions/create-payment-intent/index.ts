// supabase/functions/create-payment-intent/index.ts
// Creates a Stripe PaymentIntent with server-verified prices.
// Used by the embedded checkout flow (Apple Pay / Google Pay / Link / Card
// rendered directly on the site via Stripe Elements).
//
// The frontend gets back a `clientSecret` and mounts Stripe Elements with it,
// then calls stripe.confirmPayment() on submit. The webhook then handles
// the `payment_intent.succeeded` event to create the order in Supabase.

import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50
const DELIVERY_FEE_CENTS = 1500;            // $15
const STRIPE_METADATA_LIMIT = 500;          // per-value char limit

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      items,            // [{ product_id, variant_code, qty, add_on_ids? }]
      customer_name,
      customer_phone,
      customer_email,
      delivery_date,
      notes,
      is_pickup,
    } = body;

    if (!items?.length || !customer_name || !customer_phone || !delivery_date) {
      return json({ error: "Missing required fields" }, 400);
    }

    // ─── Server-side price verification ───
    const orderItems: any[] = [];
    const productDescriptions: string[] = [];
    let subtotalCents = 0;

    for (const item of items) {
      const { data: product, error: pErr } = await supabase
        .from("products")
        .select(`
          id, name,
          variants!inner ( variant_code, name, price_cents ),
          product_add_ons ( add_ons ( id, name, price_cents ) )
        `)
        .eq("id", item.product_id)
        .eq("variants.variant_code", item.variant_code)
        .single();

      if (pErr || !product) {
        return json({ error: `Product not found: ${item.product_id}` }, 400);
      }

      const variant = product.variants[0];
      let unitPriceCents = variant.price_cents;

      if (item.add_on_ids?.length) {
        for (const addOnId of item.add_on_ids) {
          const ao = (product.product_add_ons || [])
            .map((pa: any) => pa.add_ons)
            .find((a: any) => String(a.id) === String(addOnId));
          if (ao) unitPriceCents += ao.price_cents;
        }
      }

      const lineCents = unitPriceCents * item.qty;
      subtotalCents += lineCents;

      productDescriptions.push(`${product.name} × ${item.qty}`);
      orderItems.push({
        product_id: item.product_id,
        variant_code: item.variant_code,
        qty: item.qty,
        line_cents: lineCents,
        add_on_ids: item.add_on_ids || [],
      });
    }

    // ─── Delivery fee ───
    const deliveryCents = (is_pickup || subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS)
      ? 0
      : DELIVERY_FEE_CENTS;

    const totalCents = subtotalCents + deliveryCents;

    if (totalCents < 50) {
      return json({ error: "Order total too low for Stripe (min $0.50 AUD)" }, 400);
    }

    // ─── Serialize order_items for metadata. Stripe limits each metadata
    // value to 500 chars; bail loudly if we exceed (rare unless huge cart). ───
    const orderItemsJson = JSON.stringify(orderItems);
    if (orderItemsJson.length > STRIPE_METADATA_LIMIT) {
      return json({ error: "Cart too large for embedded checkout — please contact us." }, 400);
    }

    // ─── Create PaymentIntent ───
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "aud",
      // automatic_payment_methods lets Stripe show every method enabled in
      // the dashboard (Apple Pay, Google Pay, Link, card, etc.). The frontend
      // Express Checkout Element + Payment Element render the UI for these.
      automatic_payment_methods: { enabled: true },
      description: productDescriptions.join(" + ").slice(0, 200),
      receipt_email: customer_email || undefined,
      metadata: {
        customer_name,
        customer_phone,
        customer_email: customer_email || "",
        delivery_date,
        notes: (notes || "").slice(0, STRIPE_METADATA_LIMIT),
        is_pickup: is_pickup ? "true" : "false",
        total_cents: String(totalCents),
        order_items: orderItemsJson,
        source: "embedded-checkout",
      },
    });

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalCents,
      subtotalCents,
      deliveryCents,
    }, 200);
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return json({ error: err.message }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
