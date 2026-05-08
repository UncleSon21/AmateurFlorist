// src/scripts/cart.ts — FIXED VERSION
// Cart drawer now shows proper product names instead of raw UUIDs

import { qsa } from "./utils";
import { fetchProductById } from "./db";

export type CartItem = {
  productId: string;
  variantId: string;
  addOnIds: string[];
  qty: number;
};

const KEY = "vf_cart_v1";

export function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function saveCart(c: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function addToCart(item: CartItem) {
  const cart = loadCart();
  const i = cart.findIndex(ci =>
    ci.productId === item.productId &&
    ci.variantId === item.variantId &&
    JSON.stringify(ci.addOnIds) === JSON.stringify(item.addOnIds)
  );
  if (i >= 0) {
    const existing = cart[i];
    if (existing) existing.qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  document.dispatchEvent(new CustomEvent("cart:changed"));
}

export function removeFromCart(index: number) {
  const cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  document.dispatchEvent(new CustomEvent("cart:changed"));
}

/* ── Product name cache to avoid repeated Supabase calls ── */
const nameCache: Map<string, { name: string; variantName: string; image: string }> = new Map();

async function resolveProduct(productId: string, variantId: string): Promise<{ name: string; variantName: string; image: string }> {
  const cacheKey = `${productId}|${variantId}`;
  if (nameCache.has(cacheKey)) return nameCache.get(cacheKey)!;

  try {
    const p = await fetchProductById(productId);
    const variant = p.variants.find((v: any) => v.code === variantId) || p.variants[0];
    const result = {
      name: p.name || "Flower Arrangement",
      variantName: variant?.name || "",
      image: p.images?.[0] || "",
    };
    nameCache.set(cacheKey, result);
    return result;
  } catch {
    return { name: "Flower Arrangement", variantName: "", image: "" };
  }
}

/* ── Cart Drawer ── */
export function mountCartDrawer() {
  const el = document.createElement("div");
  el.id = "cart-drawer";
  el.innerHTML = `<div class="cart-drawer-loading">Loading cart…</div>`;
  document.body.appendChild(el);

  // Inject styles — uses CSS variables from seasonalTheme.ts so the drawer
  // re-themes when the season changes (--accent, --bg, --bg-alt, etc.)
  const style = document.createElement("style");
  style.textContent = `
    #cart-drawer {
      position: fixed;
      right: 20px;
      bottom: 20px;
      background: var(--bg, #fff);
      border: .5px solid var(--border, rgba(28,22,18,.13));
      border-radius: var(--radius, 2px);
      box-shadow: 0 12px 40px rgba(28,22,18,.10), 0 2px 8px rgba(28,22,18,.04);
      max-width: 340px;
      min-width: 280px;
      z-index: 9999;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      color: var(--text, #1e1a17);
      transition: opacity 0.2s ease, transform 0.2s ease, background 0.4s, border-color 0.4s;
    }
    #cart-drawer .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: .5px solid var(--border, rgba(28,22,18,.13));
      background: var(--bg-alt, #faf8f5);
    }
    #cart-drawer .drawer-header h3 {
      margin: 0;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--accent, #8b7355);
    }
    #cart-drawer .drawer-header .drawer-count {
      font-size: 11px;
      color: var(--text-muted, #6b5d54);
      letter-spacing: .5px;
    }
    #cart-drawer .drawer-body {
      padding: 12px 18px;
      max-height: 260px;
      overflow-y: auto;
    }
    #cart-drawer .drawer-empty {
      text-align: center;
      padding: 20px 0;
      color: var(--text-muted, #6b5d54);
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 14px;
    }
    #cart-drawer .drawer-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: .5px solid var(--border, rgba(28,22,18,.13));
    }
    #cart-drawer .drawer-item:last-child {
      border-bottom: none;
    }
    #cart-drawer .drawer-item-img {
      width: 44px;
      height: 44px;
      border-radius: var(--radius, 2px);
      overflow: hidden;
      background: var(--bg-alt, #faf8f5);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    #cart-drawer .drawer-item-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #cart-drawer .drawer-item-info {
      flex: 1;
      min-width: 0;
    }
    #cart-drawer .drawer-item-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 400;
      color: var(--text, #1e1a17);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #cart-drawer .drawer-item-variant {
      font-size: 11px;
      color: var(--text-muted, #6b5d54);
      letter-spacing: .5px;
    }
    #cart-drawer .drawer-item-qty {
      font-size: 11px;
      color: var(--accent, #8b7355);
      font-weight: 500;
      letter-spacing: 1px;
      flex-shrink: 0;
    }
    #cart-drawer .drawer-item-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--accent-light, #c8b89a);
      padding: 4px;
      border-radius: var(--radius, 2px);
      font-size: 12px;
      transition: color 0.2s;
      flex-shrink: 0;
    }
    #cart-drawer .drawer-item-remove:hover {
      color: var(--accent-dark, #2c2420);
    }
    #cart-drawer .drawer-footer {
      padding: 14px 18px;
      border-top: .5px solid var(--border, rgba(28,22,18,.13));
    }
    #cart-drawer .drawer-footer a {
      display: block;
      text-align: center;
      background: var(--accent-dark, #2c2420);
      color: var(--bg, #fff);
      text-decoration: none;
      padding: 12px;
      border-radius: var(--radius, 2px);
      font-weight: 500;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      transition: background 0.3s;
    }
    #cart-drawer .drawer-footer a:hover {
      background: var(--accent, #8b7355);
    }
    .cart-drawer-loading {
      padding: 20px;
      text-align: center;
      color: var(--text-muted, #6b5d54);
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  const render = async () => {
    const cart = loadCart();

    if (cart.length === 0) {
      el.innerHTML = `
        <div class="drawer-header">
          <h3>Cart</h3>
          <span class="drawer-count">0 items</span>
        </div>
        <div class="drawer-body">
          <div class="drawer-empty">Your cart is empty</div>
        </div>
        <div class="drawer-footer">
          <a href="shop.html">Browse Flowers</a>
        </div>
      `;
      return;
    }

    // Show loading while resolving names
    el.innerHTML = `
      <div class="drawer-header">
        <h3>Cart</h3>
        <span class="drawer-count">${cart.reduce((s, ci) => s + ci.qty, 0)} items</span>
      </div>
      <div class="drawer-body">
        <div class="cart-drawer-loading">Loading…</div>
      </div>
    `;

    // Resolve all product names
    const resolved = await Promise.all(
      cart.map(async (ci, idx) => {
        const info = await resolveProduct(ci.productId, ci.variantId);
        return { ci, idx, ...info };
      })
    );

    const itemsHTML = resolved.map(r => `
      <div class="drawer-item">
        <div class="drawer-item-img">
          ${r.image
            ? `<img src="${r.image}" alt="${r.name}" onerror="this.style.display='none';this.parentElement.textContent='🌹'">`
            : '🌹'
          }
        </div>
        <div class="drawer-item-info">
          <div class="drawer-item-name">${r.name}</div>
          ${r.variantName ? `<div class="drawer-item-variant">${r.variantName}</div>` : ''}
        </div>
        <span class="drawer-item-qty">×${r.ci.qty}</span>
        <button class="drawer-item-remove" data-remove="${r.idx}" title="Remove">✕</button>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="drawer-header">
        <h3>Cart</h3>
        <span class="drawer-count">${cart.reduce((s, ci) => s + ci.qty, 0)} items</span>
      </div>
      <div class="drawer-body">${itemsHTML}</div>
      <div class="drawer-footer">
        <a href="cart.html">View Cart &amp; Checkout</a>
      </div>
    `;

    qsa<HTMLButtonElement>("button[data-remove]", el).forEach(btn => {
      btn.addEventListener("click", () => {
        removeFromCart(Number(btn.dataset["remove"]));
      });
    });
  };

  document.addEventListener("cart:changed", () => render());
  render();
}