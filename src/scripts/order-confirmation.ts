// src/scripts/order-confirmation.ts
// UPDATED: Handles both ?id= and ?session_id= from Stripe redirect.
// FIXED: Removed broken variant join — looks up variant name via product instead.

import { supabase } from "./db";
import { formatPrice } from "./utils";

const FREE_DELIVERY_THRESHOLD_CENTS = 5000;
const DELIVERY_FEE_CENTS            = 1500;

function $(id: string) { return document.getElementById(id) as HTMLElement; }
function fmt(cents: number) { return formatPrice(cents / 100); }

/* ── Fetch order items with product info (no variant join) ── */
async function fetchOrderItems(orderId: string) {
  const { data: items, error } = await supabase
    .from("order_items")
    .select(`
      id, qty, line_cents, variant_code, product_id,
      products ( name, product_images ( image_url, sort_order ) )
    `)
    .eq("order_id", orderId);

  if (error) throw error;

  // Look up variant names from the variants table via product_id + variant_code
  const enriched = [];
  for (const item of (items || [])) {
    let variantName = item.variant_code || "";

    // Try to get the human-readable variant name
    const { data: variant } = await supabase
      .from("variants")
      .select("name")
      .eq("product_id", item.product_id)
      .eq("variant_code", item.variant_code)
      .maybeSingle();

    if (variant) variantName = variant.name;

    enriched.push({ ...item, variant_name: variantName });
  }

  return enriched;
}

/* ── Fetch order by ID ── */
async function fetchOrderById(orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_phone, delivery_date, notes, total_cents, status, created_at")
    .eq("id", orderId)
    .single();

  if (error || !order) throw error ?? new Error("Order not found");

  const items = await fetchOrderItems(orderId);
  return { order, items };
}

/* ── Fetch order by Stripe session ID (with retry/polling) ── */
async function fetchOrderBySessionId(sessionId: string, retries = 8): Promise<{ order: any; items: any[] }> {
  for (let i = 0; i < retries; i++) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, delivery_date, notes, total_cents, status, created_at")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (order) {
      const items = await fetchOrderItems(order.id);
      return { order, items };
    }

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  throw new Error("Order not found — the payment was successful but the order is still being processed. Please check back in a moment.");
}

/* ── Fetch order by Stripe PaymentIntent ID (embedded flow) ── */
async function fetchOrderByPaymentIntent(piId: string, retries = 8): Promise<{ order: any; items: any[] }> {
  for (let i = 0; i < retries; i++) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, delivery_date, notes, total_cents, status, created_at")
      .eq("stripe_payment_intent", piId)
      .maybeSingle();

    if (order) {
      const items = await fetchOrderItems(order.id);
      return { order, items };
    }

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  throw new Error("Order not found — the payment was successful but the order is still being processed. Please check back in a moment.");
}

/* ── Format date nicely ── */
function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/* ── Derive delivery fee ── */
function deriveDelivery(totalCents: number, items: any[]) {
  const itemsTotal = items.reduce((s: number, i: any) => s + i.line_cents, 0);
  const diff = totalCents - itemsTotal;
  if (diff > 0 && diff <= DELIVERY_FEE_CENTS) return diff;
  if (itemsTotal >= FREE_DELIVERY_THRESHOLD_CENTS) return 0;
  if (totalCents === itemsTotal) return 0;
  return DELIVERY_FEE_CENTS;
}

/* ── Render ── */
function render(order: any, items: any[]) {
  const isPickup = (order.notes || "").toLowerCase().includes("pick up") ||
                   (order.notes || "").toLowerCase().includes("pickup");

  $("order-id-display").textContent = order.id;

  $("copy-id-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(order.id).then(() => {
      const btn = $("copy-id-btn");
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    });
  });

  const detailData: Array<[string, string]> = [
    ["Name",          order.customer_name],
    ["Phone",         order.customer_phone],
    ["Delivery Date", fmtDate(order.delivery_date)],
    ["Delivery Type", isPickup ? "Pickup" : "Delivery"],
    ["Payment",       order.status === "paid" ? "✓ Paid" : order.status],
  ];

  if (order.notes) {
    const displayNotes = order.notes
      .replace(/Deliver to:.*$/m, "")
      .replace(/Customer will pick up\./i, "")
      .replace(/Preferred time:.*$/m, "")
      .trim();
    if (displayNotes) detailData.push(["Notes", displayNotes]);
  }

  $("order-details").innerHTML = detailData.map(([k, v]) => `
    <div class="detail-row">
      <span class="detail-key">${k}</span>
      <span class="detail-val">${v}</span>
    </div>
  `).join("");

  $("order-items-list").innerHTML = items.map((item: any) => {
    const productName  = item.products?.name ?? "Flower Arrangement";
    const variantName  = item.variant_name ?? item.variant_code ?? "";
    const images       = item.products?.product_images ?? [];
    const sortedImages = [...images].sort((a: any, b: any) => a.sort_order - b.sort_order);
    const imgUrl       = sortedImages[0]?.image_url ?? "";

    return `
      <div class="order-item-row">
        <div class="order-item-img">
          ${imgUrl
            ? `<img src="${imgUrl}" alt="${productName}" onerror="this.style.display='none'">`
            : "🌹"}
        </div>
        <div class="order-item-info">
          <div class="order-item-name">${productName}</div>
          <div class="order-item-meta">${variantName}${item.qty > 1 ? ` × ${item.qty}` : ""}</div>
        </div>
        <div class="order-item-price">${fmt(item.line_cents)}</div>
      </div>
    `;
  }).join("");

  const subtotal  = items.reduce((s: number, i: any) => s + i.line_cents, 0);
  const delivery  = isPickup ? 0 : deriveDelivery(order.total_cents, items);
  const total     = order.total_cents;

  $("cost-rows").innerHTML = `
    <div class="cost-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    <div class="cost-row"><span>Delivery</span><span>${delivery === 0 ? "FREE" : fmt(delivery)}</span></div>
    <div class="cost-row total"><span>Total Paid</span><span>${fmt(total)}</span></div>
  `;

  $("conf-loading").style.display  = "none";
  $("conf-content").style.display  = "block";
}

/* ── Boot ── */
async function main() {
  const params       = new URLSearchParams(window.location.search);
  const orderId      = params.get("id");
  const sessionId    = params.get("session_id");           // redirect flow (legacy)
  const paymentIntent = params.get("payment_intent");      // embedded flow (current)

  if (!orderId && !sessionId && !paymentIntent) {
    $("conf-loading").style.display = "none";
    $("conf-error").style.display   = "block";
    return;
  }

  try {
    let result;

    if (orderId) {
      result = await fetchOrderById(orderId);
    } else if (paymentIntent) {
      result = await fetchOrderByPaymentIntent(paymentIntent);
    } else {
      result = await fetchOrderBySessionId(sessionId!);
    }

    // Clear cart now that payment succeeded + order is in DB
    try {
      localStorage.removeItem("vf_cart_v1");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch (e) { /* ignore */ }

    render(result.order, result.items);

    // Replace the URL with a clean ?id=… (hides Stripe's payment_intent params)
    if ((sessionId || paymentIntent) && result.order.id) {
      window.history.replaceState({}, "", `order-confirmation.html?id=${result.order.id}`);
    }
  } catch (err: any) {
    console.error("Failed to load order:", err);
    $("conf-loading").style.display = "none";
    $("conf-error").style.display   = "block";

    const errorEl = $("conf-error");
    if (sessionId && err.message?.includes("still being processed")) {
      errorEl.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <h2 style="color:#8b6f6f;">Payment Successful!</h2>
          <p>Your payment went through, but your order is still being processed.</p>
          <p>This usually takes just a few seconds. Please refresh the page.</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:12px 24px;background:#8b6f6f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

main();