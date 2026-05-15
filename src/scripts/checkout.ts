// src/scripts/checkout.ts
// EMBEDDED Stripe payment flow — two-step single-page checkout.
//   1. User fills form (name, address, date, etc.) and clicks "Continue to payment".
//   2. Form validates → PaymentIntent created server-side with the form data
//      locked into metadata → Apple Pay / Google Pay / Link + card form mount
//      below the form.
//   3. User pays. Order is created server-side by stripe-webhook when
//      `payment_intent.succeeded` fires.
// No redirect to Stripe's hosted page.

import { fetchProductById } from "./db";
import { loadCart } from "./cart";
import { formatPrice } from "./utils";

const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50
const DELIVERY_FEE_CENTS            = 1500; // $15

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;
const STRIPE_PK = import.meta.env['VITE_STRIPE_PUBLISHABLE_KEY'] as string | undefined;

const PI_ENDPOINT = `${SUPABASE_URL}/functions/v1/create-payment-intent`;

// ─── Helpers ───
function $(id: string) { return document.getElementById(id) as HTMLElement; }
function inp(id: string) { return document.getElementById(id) as HTMLInputElement; }
function fmt(cents: number) { return formatPrice(cents / 100); }

// Stripe.js is loaded via a CDN <script> tag in checkout.html. Type as `any`
// to avoid pulling in @stripe/stripe-js (handles its own typing at runtime).
const StripeGlobal: any = (window as any).Stripe;

/* ─── Set minimum delivery date to today ─── */
function initDeliveryDate() {
  const el = inp("delivery-date");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  el.min = today.toISOString().split("T")[0] ?? "";
  if (!el.value) el.value = el.min;
}

/* ─── Delivery / Pickup toggle ─── */
function initDeliveryToggle(onChange: () => void) {
  const btnDelivery = $("btn-delivery");
  const btnPickup   = $("btn-pickup");
  const fields      = $("delivery-fields");
  const note        = $("pickup-note");

  btnDelivery.addEventListener("click", () => {
    if (btnDelivery.hasAttribute("data-locked")) return;
    btnDelivery.classList.add("active");
    btnPickup.classList.remove("active");
    fields.style.display = "block";
    note.style.display   = "none";
    onChange();
  });

  btnPickup.addEventListener("click", () => {
    if (btnPickup.hasAttribute("data-locked")) return;
    btnPickup.classList.add("active");
    btnDelivery.classList.remove("active");
    fields.style.display = "none";
    note.style.display   = "block";
    onChange();
  });
}

function lockDeliveryToggle() {
  $("btn-delivery").setAttribute("data-locked", "true");
  $("btn-pickup").setAttribute("data-locked", "true");
  // Visually communicate the lock
  $("btn-delivery").style.opacity = "0.6";
  $("btn-pickup").style.opacity = "0.6";
  $("btn-delivery").style.cursor = "not-allowed";
  $("btn-pickup").style.cursor = "not-allowed";
}

/* ─── Enrich cart items from Supabase ─── */
type EnrichedLine = {
  name: string;
  variantName: string;
  image: string;
  priceCents: number;
  qty: number;
  productId: string;
  variantCode: string;
  addOnIds: string[];
  lineCents: number;
};

async function enrichCart(): Promise<EnrichedLine[]> {
  const cart = loadCart();
  const lines: EnrichedLine[] = [];

  for (const ci of cart) {
    try {
      const p = await fetchProductById(ci.productId);
      const variant = p.variants.find((v: any) => v.code === ci.variantId) || p.variants[0];
      let priceCents = variant?.priceCents ?? 0;

      for (const id of ci.addOnIds) {
        const ao = (p.addOns || []).find((a: any) => String(a.id) === String(id));
        if (ao) priceCents += ao.priceCents;
      }

      lines.push({
        name:        p.name,
        variantName: variant?.name ?? "",
        image:       p.images?.[0] ?? "",
        priceCents,
        qty:         ci.qty,
        productId:   ci.productId,
        variantCode: variant?.code ?? ci.variantId,
        addOnIds:    ci.addOnIds,
        lineCents:   priceCents * ci.qty,
      });
    } catch (err) {
      console.error("Failed to enrich cart item", ci.productId, err);
    }
  }

  return lines;
}

/* ─── Render order summary ─── */
function renderSummary(lines: EnrichedLine[]) {
  const subtotal  = lines.reduce((s, l) => s + l.lineCents, 0);
  const isFree    = subtotal >= FREE_DELIVERY_THRESHOLD_CENTS;
  const isPickup  = $("btn-pickup").classList.contains("active");
  const delivery  = (isFree || isPickup) ? 0 : DELIVERY_FEE_CENTS;
  const total     = subtotal + delivery;

  $("summary-items").innerHTML = lines.map(l => `
    <div class="summary-line">
      <div class="summary-line-img">
        ${l.image
          ? `<img src="${l.image}" alt="${l.name}" onerror="this.style.display='none'">`
          : "🌹"}
      </div>
      <div class="summary-line-info">
        <div class="summary-line-name">${l.name}</div>
        <div class="summary-line-meta">${l.variantName}${l.qty > 1 ? ` × ${l.qty}` : ""}</div>
      </div>
      <div class="summary-line-price">${fmt(l.lineCents)}</div>
    </div>
  `).join("");

  $("co-subtotal").textContent = fmt(subtotal);
  $("co-delivery").textContent = (isFree || isPickup) ? "FREE" : fmt(delivery);
  $("co-total").textContent    = fmt(total);

  $("summary-loading").style.display = "none";
  $("summary-body").style.display    = "block";

  return { subtotal, delivery, total };
}

/* ─── Validation ─── */
function validateField(fieldWrapperId: string, inputId: string, test: (v: string) => boolean): boolean {
  const wrap  = $(fieldWrapperId);
  const input = inp(inputId);
  const valid = test(input.value.trim());
  wrap.classList.toggle("has-error", !valid);
  return valid;
}

function isPickupMode() {
  return $("btn-pickup").classList.contains("active");
}

function validate(): boolean {
  const results = [
    validateField("field-name",  "name",  v => v.length >= 2),
    validateField("field-phone", "phone", v => /^[\d\s\+\-\(\)]{8,}$/.test(v)),
    validateField("field-delivery-date", "delivery-date", v => !!(v)),
  ];

  if (!isPickupMode()) {
    results.push(validateField("field-address", "address", v => v.length >= 5));
    results.push(validateField("field-suburb",  "suburb",  v => v.length >= 2));
  }

  return results.every(Boolean);
}

/* ─── Inline error display ─── */
function showError(message: string) {
  const el = $("pay-error");
  el.textContent = message;
  el.classList.add("show");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}
function clearError() {
  const el = $("pay-error");
  el.textContent = "";
  el.classList.remove("show");
}

/* ─── Build payload for create-payment-intent ─── */
function buildOrderPayload(lines: EnrichedLine[]) {
  const pickup = isPickupMode();
  const addressParts = pickup
    ? "Pickup"
    : [inp("address").value, inp("suburb").value, inp("postcode").value].filter(Boolean).join(", ");

  const deliveryTimeEl = document.getElementById("delivery-time") as HTMLSelectElement | null;
  const deliveryTime = deliveryTimeEl?.value || "";

  const notes = [
    inp("notes").value,
    deliveryTime ? `Preferred time: ${deliveryTime}` : "",
    pickup ? "Customer will pick up." : `Deliver to: ${addressParts}`,
  ].filter(Boolean).join("\n");

  const items = lines.map(l => ({
    product_id:   l.productId,
    variant_code: l.variantCode,
    qty:          l.qty,
    add_on_ids:   l.addOnIds.map(Number).filter(Boolean),
  }));

  const emailEl = document.getElementById("email") as HTMLInputElement | null;

  return {
    items,
    customer_name:  inp("name").value.trim(),
    customer_phone: inp("phone").value.trim(),
    customer_email: emailEl?.value.trim() || "",
    delivery_date:  inp("delivery-date").value,
    notes,
    is_pickup: pickup,
  };
}

/* ─── Backend call: create PaymentIntent ─── */
async function createPaymentIntent(lines: EnrichedLine[]) {
  const payload = buildOrderPayload(lines);
  const res = await fetch(PI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.clientSecret) {
    throw new Error(data.error || "Failed to start payment");
  }
  return data as {
    clientSecret: string;
    paymentIntentId: string;
    totalCents: number;
    subtotalCents: number;
    deliveryCents: number;
  };
}

/* ─── Mount Stripe Elements (Express Checkout + Payment Element) ─── */
async function mountStripeElements(lines: EnrichedLine[]) {
  if (!STRIPE_PK) {
    showError("Payment is not configured (missing Stripe key). Please call us directly at (02) 9123-4567.");
    return false;
  }
  if (!StripeGlobal) {
    showError("Could not load Stripe. Check your connection and refresh.");
    return false;
  }

  let intent;
  try {
    intent = await createPaymentIntent(lines);
  } catch (err: any) {
    showError(err.message || "Could not start payment. Please try again.");
    $("pay-loading").style.display = "none";
    $("pay-form").style.display = "block";
    return false;
  }

  const stripe = StripeGlobal(STRIPE_PK, { locale: "en-AU" });
  const elements = stripe.elements({
    clientSecret: intent.clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#8b7355",
        colorBackground: "#ffffff",
        colorText: "#1e1a17",
        colorDanger: "#c0392b",
        fontFamily: '"DM Sans", system-ui, sans-serif',
        borderRadius: "2px",
        fontSizeBase: "14px",
      },
    },
  });

  // ─── Express Checkout (Apple Pay / Google Pay / Link buttons) ───
  const expressEl = elements.create("expressCheckout", { buttonHeight: 48 });
  expressEl.mount("#express-checkout-element");

  expressEl.on("ready", (event: any) => {
    const methods = event.availablePaymentMethods || {};
    const anyMethod = methods.applePay || methods.googlePay || methods.link || methods.paypal;
    if (anyMethod) $("pay-divider").style.display = "flex";
  });

  expressEl.on("confirm", async () => {
    clearError();
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation.html`,
      },
    });
    if (error) {
      showError(error.message || "Payment failed. Please try a different method.");
    }
    // Success case: Stripe navigates away. The user lands on
    // /order-confirmation.html?payment_intent=... which loads the order via
    // the webhook-created row in Supabase.
  });

  // ─── Payment Element (card form) ───
  const paymentEl = elements.create("payment", { layout: { type: "tabs" } });
  paymentEl.mount("#payment-element");

  const btn = $("btn-place-order") as HTMLButtonElement;
  const btnLabel = document.getElementById("btn-place-order-label") as HTMLElement | null;
  paymentEl.on("ready", () => {
    btn.disabled = false;
    if (btnLabel) btnLabel.textContent = `Pay ${fmt(intent.totalCents)}`;
  });

  // ─── Manual submit (card flow) ───
  btn.addEventListener("click", async () => {
    clearError();
    btn.disabled = true;
    if (btnLabel) btnLabel.textContent = "Processing…";
    btn.classList.add("btn-loading");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation.html`,
        },
      });
      // confirmPayment only returns here on error; success causes a redirect.
      if (error) {
        showError(error.message || "Payment failed. Please check your details.");
        btn.disabled = false;
        if (btnLabel) btnLabel.textContent = `Pay ${fmt(intent.totalCents)}`;
        btn.classList.remove("btn-loading");
      }
    } catch (err: any) {
      showError(err.message || "Something went wrong. Please try again.");
      btn.disabled = false;
      if (btnLabel) btnLabel.textContent = `Pay ${fmt(intent.totalCents)}`;
      btn.classList.remove("btn-loading");
    }
  });

  $("pay-loading").style.display = "none";
  $("pay-form").style.display = "block";
  return true;
}

/* ─── Continue-to-payment button handler ─── */
function setupContinueButton(lines: EnrichedLine[]) {
  const continueBtn = $("btn-continue") as HTMLButtonElement;
  const paySection  = $("pay-section");

  continueBtn.addEventListener("click", async () => {
    if (!validate()) {
      // Scroll to the first error
      const firstError = document.querySelector(".field.has-error") as HTMLElement | null;
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    continueBtn.disabled = true;
    continueBtn.classList.add("btn-loading");
    const label = continueBtn.querySelector("span");
    if (label) label.textContent = "Preparing payment…";

    // Reveal payment section and lock the form's pickup/delivery toggle
    // (PI amount is set at creation; toggling after this point would mismatch).
    paySection.style.display = "block";
    lockDeliveryToggle();

    const ok = await mountStripeElements(lines);
    if (!ok) {
      // Mount failed — let user try again
      continueBtn.disabled = false;
      continueBtn.classList.remove("btn-loading");
      if (label) label.textContent = "Continue to payment";
      return;
    }

    // Hide the continue button — payment area is now in control
    continueBtn.style.display = "none";

    // Scroll to payment
    paySection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ─── Boot ─── */
async function main() {
  initDeliveryDate();

  const cart = loadCart();
  if (cart.length === 0) {
    $("checkout-empty").style.display = "block";
    $("checkout-main").style.display  = "none";
    return;
  }

  $("checkout-empty").style.display = "none";
  $("checkout-main").style.display  = "grid";

  const lines = await enrichCart();
  renderSummary(lines);

  initDeliveryToggle(() => renderSummary(lines));
  setupContinueButton(lines);

  // Live validation on blur (clears red borders as they fix mistakes)
  ["name", "phone", "delivery-date", "address", "suburb"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("blur", () => validate());
  });
}

main().catch(console.error);
