// supabase/functions/create-checkout-session/index.ts
// Creates a Stripe Checkout Session with server-verified prices.
// The frontend calls this instead of writing orders directly to Supabase.

import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── CORS headers (needed for browser → Edge Function calls) ───
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50
const DELIVERY_FEE_CENTS = 1500;            // $15

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      items,          // [{ product_id, variant_code, qty, add_on_ids? }]
      customer_name,
      customer_phone,
      customer_email,
      delivery_date,
      notes,
      is_pickup,
      success_url,    // e.g. "https://www.amateurflorist.co/order-confirmation.html"
      cancel_url,     // e.g. "https://www.amateurflorist.co/checkout.html"
    } = body;

    // ─── Validate required fields ───
    if (!items?.length || !customer_name || !customer_phone || !delivery_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Server-side price verification from Supabase ───
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: any[] = []; // Stored in metadata for the webhook
    let subtotalCents = 0;

    for (const item of items) {
      // Fetch product + variant from DB
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
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const variant = product.variants[0];
      let unitPriceCents = variant.price_cents;
      const addOnNames: string[] = [];

      // Add-on prices (also server-verified)
      if (item.add_on_ids?.length) {
        for (const addOnId of item.add_on_ids) {
          const ao = (product.product_add_ons || [])
            .map((pa: any) => pa.add_ons)
            .find((a: any) => String(a.id) === String(addOnId));
          if (ao) {
            unitPriceCents += ao.price_cents;
            addOnNames.push(ao.name);
          }
        }
      }

      const lineCents = unitPriceCents * item.qty;
      subtotalCents += lineCents;

      // Build Stripe line item with inline price
      const description = [variant.name, ...addOnNames].filter(Boolean).join(" + ");
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: product.name,
            description: description || undefined,
          },
          unit_amount: unitPriceCents,
        },
        quantity: item.qty,
      });

      // Save for webhook to write to DB
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

    if (deliveryCents > 0) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: { name: "Delivery Fee" },
          unit_amount: deliveryCents,
        },
        quantity: 1,
      });
    }

    const totalCents = subtotalCents + deliveryCents;

    // ─── Create Stripe Checkout Session ───
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "aud",
      line_items: lineItems,
      customer_email: customer_email || undefined,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      // Store order data in metadata so the webhook can create the order
      metadata: {
        customer_name,
        customer_phone,
        customer_email: customer_email || "",
        delivery_date,
        notes: notes || "",
        is_pickup: is_pickup ? "true" : "false",
        total_cents: String(totalCents),
        order_items: JSON.stringify(orderItems),
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});