// src/scripts/cart_page.ts
// Renders the cart page: loads items from localStorage, fetches product details
// from Supabase, and handles qty changes + removal.
//
// DROP THIS FILE into: src/scripts/cart_page.ts
// Then add to cart.html:  <script type="module" src="src/scripts/cart_page.ts"></script>

import { fetchProductById } from "./db";
import { loadCart, saveCart, CartItem } from "./cart";
import { formatPrice } from "./utils";

const FREE_DELIVERY_THRESHOLD_CENTS = 5000; // $50
const DELIVERY_FEE_CENTS = 1500;            // $15 flat fee under threshold

/* ─── Helpers ─── */
function $(id: string) { return document.getElementById(id); }
function fmt(cents: number) { return formatPrice(cents / 100); }

/* ─── Enriched item type ─── */
type EnrichedItem = {
  cartItem: CartItem;
  cartIndex: number;
  name: string;
  variantName: string;
  image: string;
  priceCents: number;       // per-unit (variant + add-ons)
  addOnNames: string[];
};

/* ─── Fetch + enrich all cart items from Supabase ─── */
async function buildEnrichedItems(): Promise<EnrichedItem[]> {
  const cart = loadCart();
  const enriched: EnrichedItem[] = [];

  for (let i = 0; i < cart.length; i++) {
    // FIX: guard against undefined (strict array index access)
    const ci = cart[i];
    if (!ci) continue;
    try {
      const p = await fetchProductById(ci.productId);
      const variant = p.variants.find((v: any) => v.code === ci.variantId) || p.variants[0];
      let priceCents = variant?.priceCents ?? 0;

      const addOnNames: string[] = [];
      for (const addOnId of ci.addOnIds) {
        const ao = (p.addOns || []).find((a: any) => String(a.id) === String(addOnId));
        if (ao) {
          priceCents += ao.priceCents;
          addOnNames.push(ao.name);
        }
      }

      enriched.push({
        cartItem: ci,
        cartIndex: i,
        name: p.name,
        variantName: variant?.name ?? "",
        image: p.images?.[0] ?? "",
        priceCents,
        addOnNames,
      });
    } catch (err) {
      console.error("Failed to load product:", ci.productId, err);
    }
  }
  return enriched;
}

/* ─── Render a single cart row ─── */
function renderItem(item: EnrichedItem): string {
  const lineCents = item.priceCents * item.cartItem.qty;
  const imgContent = item.image
    ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
    : "";

  const addOnTags = item.addOnNames.map(n => `<span class="addon-tag">${n}</span>`).join("");
  const addOnsHtml = item.addOnNames.length
    ? `<div class="item-addons">${addOnTags}</div>`
    : "";

  return `
    <div class="cart-item" data-index="${item.cartIndex}">
      <div class="item-image">
        ${imgContent}
      </div>
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-meta">${item.variantName}</div>
        ${addOnsHtml}
        <div class="item-qty-row">
          <button class="qty-btn" data-action="dec" data-index="${item.cartIndex}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.cartItem.qty}</span>
          <button class="qty-btn" data-action="inc" data-index="${item.cartIndex}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="item-right">
        <div class="item-price">${fmt(lineCents)}</div>
        <button class="item-remove" data-index="${item.cartIndex}" aria-label="Remove item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6M14 11v6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/* ─── Update order summary panel ─── */
function updateSummary(items: EnrichedItem[]) {
  const subtotalCents = items.reduce((sum, it) => sum + it.priceCents * it.cartItem.qty, 0);
  const itemCount = items.reduce((sum, it) => sum + it.cartItem.qty, 0);
  const isFreeDelivery = subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS;
  const deliveryCents = items.length === 0 ? 0 : (isFreeDelivery ? 0 : DELIVERY_FEE_CENTS);
  const totalCents = subtotalCents + deliveryCents;
  const progress = Math.min(100, (subtotalCents / FREE_DELIVERY_THRESHOLD_CENTS) * 100);
  const remaining = FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents;

  ($("item-count") as HTMLElement).textContent = String(itemCount);
  ($("summary-subtotal") as HTMLElement).textContent = fmt(subtotalCents);
  ($("summary-total") as HTMLElement).textContent = fmt(totalCents);
  ($("delivery-bar") as HTMLElement).style.width = `${progress}%`;

  const deliveryEl = $("summary-delivery") as HTMLElement;
  const progressText = $("delivery-progress-text") as HTMLElement;

  if (items.length === 0) {
    deliveryEl.textContent = "—";
    progressText.textContent = "Add items to see delivery estimate";
  } else if (isFreeDelivery) {
    deliveryEl.textContent = "FREE";
    deliveryEl.style.color = "#5a9a5a";
    progressText.textContent = "You've unlocked free delivery";
    progressText.style.color = "#5a9a5a";
  } else {
    deliveryEl.textContent = fmt(DELIVERY_FEE_CENTS);
    deliveryEl.style.color = "";
    progressText.textContent = `Add ${fmt(remaining)} more for free delivery`;
    progressText.style.color = "";
  }

  // Enable/disable checkout button
  const checkoutBtn = $("btn-checkout") as HTMLAnchorElement;
  if (items.length > 0) {
    checkoutBtn.style.pointerEvents = "auto";
    checkoutBtn.style.opacity = "1";
  } else {
    checkoutBtn.style.pointerEvents = "none";
    checkoutBtn.style.opacity = "0.5";
  }
}

/* ─── Update navbar cart badge ─── */
function updateNavCount() {
  const cart = loadCart();
  const total = cart.reduce((s, ci) => s + ci.qty, 0);
  const el = $("nav-cart-count");
  if (el) el.textContent = String(total);
}

/* ─── Wire up qty + remove buttons ─── */
function attachListeners(container: HTMLElement) {
  // Quantity buttons
  container.querySelectorAll<HTMLButtonElement>(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // FIX: bracket notation for dataset
      const idx = parseInt(btn.dataset["index"] ?? "0");
      const action = btn.dataset["action"] ?? "";
      const cart = loadCart();
      const item = cart[idx];
      if (!item) return;

      if (action === "inc") {
        item.qty += 1;
      } else {
        item.qty -= 1;
        if (item.qty <= 0) cart.splice(idx, 1);
      }
      saveCart(cart);
      document.dispatchEvent(new CustomEvent("cart:changed"));
      render();
    });
  });

  // Remove buttons
  container.querySelectorAll<HTMLButtonElement>(".item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      // FIX: bracket notation for dataset
      const idx = parseInt(btn.dataset["index"] ?? "0");
      const cart = loadCart();
      cart.splice(idx, 1);
      saveCart(cart);
      document.dispatchEvent(new CustomEvent("cart:changed"));

      // Animate out before re-rendering
      const row = btn.closest(".cart-item") as HTMLElement;
      if (row) {
        row.style.transition = "all 0.25s ease";
        row.style.opacity = "0";
        row.style.transform = "translateX(20px)";
        setTimeout(() => render(), 260);
      } else {
        render();
      }
    });
  });
}

/* ─── Main render ─── */
async function render() {
  $("cart-loading")!.style.display = "block";
  $("cart-empty")!.style.display = "none";
  $("cart-list")!.style.display = "none";

  const items = await buildEnrichedItems();

  $("cart-loading")!.style.display = "none";

  const subtitle = $("cart-subtitle") as HTMLElement;

  if (items.length === 0) {
    $("cart-empty")!.style.display = "block";
    subtitle.textContent = "Your cart is empty.";
  } else {
    const listEl = $("cart-list") as HTMLElement;
    listEl.style.display = "block";
    listEl.innerHTML = items.map(renderItem).join("");
    const totalQty = items.reduce((s, it) => s + it.cartItem.qty, 0);
    subtitle.textContent = `${totalQty} item${totalQty !== 1 ? "s" : ""} ready for checkout`;
    attachListeners(listEl);
  }

  updateSummary(items);
  updateNavCount();
}

// Boot
render();