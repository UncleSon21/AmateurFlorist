// src/scripts/product-details.ts
import { fetchProductById } from "./db";
import { loadCart, addToCart } from "./cart";

// ── Care guides ────────────────────────────────────────────────────────────────
// Rendered per product.material. Silk/preserved products must NEVER be told to
// water or re-trim stems — the box arrives and the customer can tell it's silk,
// so wrong care copy reads as dishonest and hurts reviews.
const CARE_GUIDES: Record<string, string> = {
  fresh: `
    <ol>
      <li>Remove flowers from packaging immediately</li>
      <li>Cut 2–3cm off stems at a 45° angle</li>
      <li>Remove any leaves below the water line</li>
      <li>Place in a clean vase with fresh, cool water</li>
      <li>Add flower food if provided</li>
      <li>Change water every 2–3 days</li>
      <li>Keep away from direct sunlight and heating vents</li>
    </ol>`,
  silk: `
    <ol>
      <li>Unwrap gently and reshape petals by hand</li>
      <li>Never place in water</li>
      <li>Dust every few weeks with a soft brush or hairdryer on cool</li>
      <li>Keep out of direct sunlight to prevent fading</li>
      <li>Store upright in the original box between uses</li>
    </ol>`,
  preserved: `
    <ol>
      <li>Never place in water</li>
      <li>Keep in a dry room — humidity causes wilting</li>
      <li>Avoid direct sunlight</li>
      <li>Dust lightly with a soft brush only</li>
      <li>Handle by the stems, not the petals</li>
    </ol>`,
};
CARE_GUIDES["artificial"] = CARE_GUIDES["silk"]!;

// ── Details copy ──────────────────────────────────────────────────────────────
// The description comes from the products table. These bullets state only what
// is true of every product of that material — never product-specific claims
// (growers, same-morning cutting, etc.), which used to leak onto silk pieces.
const DETAILS_POINTS: Record<string, string[]> = {
  fresh: [
    "Fresh flowers, arranged and delivered across Greater Sydney",
    "Choose your delivery date at checkout",
    "See the Care Guide tab to keep them at their best",
  ],
  artificial: [
    "Artificial (silk) flowers: no water, no wilting, made to last",
    "A keepsake you can display for years",
    "See the Care Guide tab to keep them looking their best",
  ],
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function qs<T extends Element>(sel: string, ctx: Document | Element = document) {
  return ctx.querySelector<T>(sel);
}

function updateNavCount() {
  const cart = loadCart();
  const total = cart.reduce((s: number, ci: any) => s + ci.qty, 0);
  // Update both #nav-cart-count (id) and any .cart-count (class) — the nav badge has both.
  document.querySelectorAll<HTMLElement>("#nav-cart-count, .cart-count").forEach(el => {
    if (total > 0) {
      el.textContent = String(total);
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });
  // Also dispatch to other tabs / listeners
  window.dispatchEvent(new Event("cart:changed"));
}

// ── State ─────────────────────────────────────────────────────────────────────
let product: any = null;
let selectedVariantIdx = 0;
let presentationExtra = 0;   // 0 or 3000 cents ($30)
let qty = 1;
const selectedAddOnIds: Set<number> = new Set();
const selectedAddOnCents: Map<number, number> = new Map();

// ── Price display ─────────────────────────────────────────────────────────────
function refreshTotal() {
  if (!product) return;
  const variantCents = product.variants[selectedVariantIdx]?.priceCents ?? 0;
  const addOnTotal = Array.from(selectedAddOnCents.values()).reduce((a, b) => a + b, 0);
  const lineCents = (variantCents + presentationExtra + addOnTotal) * qty;

  const nameEl = qs<HTMLElement>("#summary-product-name");
  const priceEl = qs<HTMLElement>("#summary-product-price");
  const totalEl = qs<HTMLElement>("#total-price");
  const variantName = product.variants[selectedVariantIdx]?.name ?? "";

  if (nameEl) nameEl.textContent = `${product.name} – ${variantName}`;
  if (priceEl) priceEl.textContent = `$${(variantCents / 100).toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${(lineCents / 100).toFixed(2)}`;

  // addon rows in summary
  const addOnSummary = qs<HTMLElement>("#summary-addons");
  if (addOnSummary) {
    addOnSummary.innerHTML = "";
    selectedAddOnIds.forEach(id => {
      const cents = selectedAddOnCents.get(id) ?? 0;
      const addon = product.addOns?.find((a: any) => a.id === id);
      if (!addon) return;
      const row = document.createElement("div");
      row.className = "summary-item addon-row";
      row.innerHTML = `<span>+ ${addon.name}</span><span>$${(cents / 100).toFixed(2)}</span>`;
      addOnSummary.appendChild(row);
    });
  }

  // presentation row
  const presEl = qs<HTMLElement>("#summary-presentation");
  if (presEl) {
    presEl.style.display = presentationExtra > 0 ? "flex" : "none";
    const presPrice = qs<HTMLElement>("#summary-presentation-price");
    if (presPrice) presPrice.textContent = `$${(presentationExtra / 100).toFixed(2)}`;
  }
}

// ── Image gallery ─────────────────────────────────────────────────────────────
function setMainImage(url: string) {
  const img = qs<HTMLImageElement>("#p-image");
  const placeholder = qs<HTMLElement>(".image-placeholder");
  if (!img) return;
  if (url) {
    img.src = url;
    img.style.display = "block";
    if (placeholder) placeholder.style.display = "none";
  } else {
    img.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
  }
}

function buildGallery(images: string[]) {
  const thumbWrap = qs<HTMLElement>(".thumbnail-images");
  if (!thumbWrap) return;

  if (!images.length) {
    thumbWrap.innerHTML = "";
    return;
  }

  setMainImage(images[0] ?? "");

  thumbWrap.innerHTML = images.map((url, i) => `
    <div class="pd-thumb thumbnail ${i === 0 ? "active" : ""}" data-idx="${i}">
      <img src="${url}" alt="Product image ${i + 1}" loading="lazy">
    </div>
  `).join("");

  thumbWrap.querySelectorAll<HTMLElement>(".pd-thumb").forEach(th => {
    th.addEventListener("click", () => {
      const idx = Number(th.dataset["idx"]);
      setMainImage(images[idx] ?? "");
      thumbWrap.querySelectorAll(".pd-thumb").forEach(t => t.classList.remove("active"));
      th.classList.add("active");
    });
  });
}

// ── Variants ──────────────────────────────────────────────────────────────────
function buildVariants(variants: any[]) {
  const wrap = qs<HTMLElement>(".size-options");
  if (!wrap) return;
  wrap.innerHTML = variants.map((v, i) => `
    <label class="size-opt size-option">
      <input type="radio" name="variant" value="${i}" ${i === 0 ? "checked" : ""}>
      <div class="size-box">
        <span class="sz-price price">$${(v.priceCents / 100).toFixed(0)}</span>
        <span class="sz-label label">${v.name}</span>
      </div>
    </label>
  `).join("");

  wrap.querySelectorAll<HTMLInputElement>('input[name="variant"]').forEach(inp => {
    inp.addEventListener("change", () => {
      selectedVariantIdx = Number(inp.value);
      refreshTotal();
    });
  });
}

// ── Add-ons ───────────────────────────────────────────────────────────────────
function buildAddOns(addOns: any[]) {
  const grid = qs<HTMLElement>('.addon-grid[data-category="chocolates"]');
  if (!grid) return;

  if (!addOns.length) {
    grid.innerHTML = `<p>No add-ons available yet.</p>`;
    return;
  }

  grid.innerHTML = addOns.map(a => `
    <div class="addon-item" data-id="${a.id}" data-cents="${a.priceCents}">
      <div class="addon-placeholder">🎁</div>
      <div class="addon-item-name">${a.name}</div>
      <div class="addon-item-price">+$${(a.priceCents / 100).toFixed(2)}</div>
      <button class="add-addon" data-id="${a.id}" data-cents="${a.priceCents}">Add</button>
    </div>
  `).join("");

  grid.querySelectorAll<HTMLButtonElement>(".add-addon").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["id"]);
      const cents = Number(btn.dataset["cents"]);
      if (selectedAddOnIds.has(id)) {
        selectedAddOnIds.delete(id);
        selectedAddOnCents.delete(id);
        btn.textContent = "Add";
        btn.classList.remove("added");
      } else {
        selectedAddOnIds.add(id);
        selectedAddOnCents.set(id, cents);
        btn.textContent = "✓ Added";
        btn.classList.add("added");
      }
      refreshTotal();
    });
  });
}

// ── Cart actions ──────────────────────────────────────────────────────────────
function buildCartItem() {
  const variant = product.variants[selectedVariantIdx];
  return {
    productId: product.id as string,
    variantId: variant?.code ?? "std",
    addOnIds: Array.from(selectedAddOnIds).map(String),
    qty,
  };
}

function handleAddToCart() {
  if (!product) return; // data failed to load: nothing valid to add
  addToCart(buildCartItem());
  updateNavCount();

  const btn = qs<HTMLButtonElement>(".btn-add-cart");
  if (btn) {
    const orig = btn.textContent ?? "ADD TO CART";
    btn.textContent = "✓ Added!";
    btn.classList.add("success");
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("success");
    }, 2000);
  }
}

function handleBuyNow() {
  if (!product) return;
  handleAddToCart();
  window.location.href = "checkout.html";
}

// ── Quantity ──────────────────────────────────────────────────────────────────
function bindQtyControls() {
  const dec = qs<HTMLButtonElement>("#qty-dec");
  const inc = qs<HTMLButtonElement>("#qty-inc");
  const disp = qs<HTMLElement>("#qty-display");

  const update = () => {
    if (disp) disp.textContent = String(qty);
    if (dec) dec.disabled = qty <= 1;
    refreshTotal();
  };

  dec?.addEventListener("click", () => { if (qty > 1) { qty--; update(); } });
  inc?.addEventListener("click", () => { qty++; update(); });
  update();
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset["tab"];
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll<HTMLElement>(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      qs<HTMLElement>(`.tab-content[data-tab="${tab}"]`)?.classList.add("active");
    });
  });
}

// ── Presentation ──────────────────────────────────────────────────────────────
function bindPresentation() {
  document.querySelectorAll<HTMLInputElement>('input[name="presentation"]').forEach(inp => {
    inp.addEventListener("change", () => {
      presentationExtra = inp.value === "vase" ? 3000 : 0;
      refreshTotal();
    });
  });
}

// ── Add-on category tabs ──────────────────────────────────────────────────────
function bindAddonCategories() {
  document.querySelectorAll<HTMLButtonElement>(".addon-category").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset["category"];
      document.querySelectorAll(".addon-category").forEach(b => b.classList.remove("active"));
      document.querySelectorAll<HTMLElement>(".addon-grid").forEach(g => g.classList.remove("active"));
      btn.classList.add("active");
      qs<HTMLElement>(`.addon-grid[data-category="${cat}"]`)?.classList.add("active");
    });
  });
}

// ── Search (Google) ──────────────────────────────────────────────────────────
// Each bouquet is its own page to Google: its own canonical address, description
// and Product structured data (real name, photos, price range, stock). Without
// this the page's canonical pointed every bouquet at the bare product page.
const SITE = "https://www.amateurflorist.co";
const MATERIAL_WORDS: Record<string, string> = {
  fresh: "Fresh flowers",
  artificial: "Silk (artificial) flowers",
  silk: "Silk flowers",
  preserved: "Preserved flowers",
};

function setSearchDetails(p: any, id: string) {
  const url = `${SITE}/product-details.html?id=${encodeURIComponent(id)}`;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);

  const prices: number[] = (p.variants || []).map((v: any) => v.priceCents).filter((c: number) => c > 0);
  const low = prices.length ? Math.min(...prices) / 100 : 0;
  const high = prices.length ? Math.max(...prices) / 100 : 0;
  const material = MATERIAL_WORDS[p.material] ?? "Flowers";
  const desc = [p.description, `${material}${low ? `, from $${low.toFixed(0)}` : ""}. Delivered across Sydney.`]
    .filter(Boolean).join(" ").slice(0, 300);
  document.querySelector('meta[name="description"]')?.setAttribute("content", desc);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: desc,
    image: (p.images || []).slice(0, 5),
    sku: p.slug || id,
    brand: { "@type": "Brand", name: "Amateur Florist" },
    material: material.replace(/ flowers$/, ""),
    url,
  };
  if (prices.length) {
    data["offers"] = {
      "@type": "AggregateOffer",
      priceCurrency: "AUD",
      lowPrice: low.toFixed(2),
      highPrice: high.toFixed(2),
      offerCount: prices.length,
      availability: p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url,
      seller: { "@type": "Organization", name: "Amateur Florist", url: `${SITE}/` },
    };
  }
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// ── Also available to hire ───────────────────────────────────────────────────
// A bouquet marked is_rentable in Supabase also offers wedding hire here, with
// its hire price and bond if set (never a made-up number). The link opens the
// weddings enquiry form with this bouquet already filled in (?piece=).
function showHireOffer(p: any) {
  const box = qs<HTMLElement>("#hireOffer");
  if (!box || !p.isRentable) return;
  const money = (c: number) => `$${Number.isInteger(c / 100) ? c / 100 : (c / 100).toFixed(2)}`;
  const priceEl = qs<HTMLElement>("#hireOfferPrice");
  if (priceEl) {
    priceEl.textContent = [
      p.rentalPriceCents != null ? `Hire ${money(p.rentalPriceCents)}` : "Hire price on request",
      p.depositCents ? `refundable bond ${money(p.depositCents)}` : "",
    ].filter(Boolean).join(" · ");
  }
  const link = qs<HTMLAnchorElement>("#hireOfferLink");
  if (link) link.href = `weddings.html?piece=${encodeURIComponent(p.name)}#enquire`;
  box.hidden = false;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  updateNavCount();
  document.addEventListener("cart:changed", updateNavCount);

  bindTabs();
  bindAddonCategories();
  bindQtyControls();
  bindPresentation();

  qs<HTMLButtonElement>(".btn-add-cart")?.addEventListener("click", handleAddToCart);
  qs<HTMLButtonElement>(".btn-buy-now")?.addEventListener("click", handleBuyNow);

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    // Nothing to show without a product id (stale link or bookmark): send them to the shop.
    window.location.replace("shop.html");
    return;
  }

  try {
    product = await fetchProductById(id);

    // Title & subtitle
    const titleEl = qs<HTMLElement>("#p-title");
    const subtitleEl = qs<HTMLElement>(".product-subtitle");
    const crumbEl = qs<HTMLElement>("#crumb-name");
    if (titleEl) titleEl.textContent = product.name;
    if (subtitleEl) subtitleEl.textContent = product.description ?? "";
    if (crumbEl) crumbEl.textContent = product.name;
    document.title = `${product.name} — Amateur Florist`;
    setSearchDetails(product, id);
    showHireOffer(product);

    // Material badge (keep .mat-badge: replacing the whole className dropped its styling)
    const badgeEl = qs<HTMLElement>("#material-badge");
    if (badgeEl) {
      badgeEl.textContent = product.material === "fresh" ? "Fresh" : "Artificial";
      badgeEl.className = `mat-badge ${product.material}`;
    }

    // About tab — description + only material-level statements
    const detailsEl = qs<HTMLElement>("#details-content");
    if (detailsEl) {
      const points = DETAILS_POINTS[product.material] ?? DETAILS_POINTS["fresh"]!;
      detailsEl.innerHTML =
        (product.description ? `<p>${escapeHtml(product.description)}</p>` : "") +
        `<ul>${points.map(p => `<li>${p}</li>`).join("")}</ul>`;
    }

    // Care guide — conditional on material so silk/preserved are never told
    // to change water (see CARE_GUIDES).
    const careEl = qs<HTMLElement>("#care-content");
    if (careEl) {
      careEl.innerHTML = CARE_GUIDES[product.material] ?? CARE_GUIDES["fresh"]!;
    }

    // Images
    buildGallery(product.images ?? []);

    // Variants
    if (product.variants?.length) {
      buildVariants(product.variants);
    }

    // Add-ons
    if (product.addOns?.length) {
      buildAddOns(product.addOns);
    }

    refreshTotal();

  } catch (err) {
    console.error("Failed to load product:", err);
    const titleEl = qs<HTMLElement>("#p-title");
    const subtitleEl = qs<HTMLElement>(".product-subtitle");
    if (titleEl) titleEl.textContent = "We couldn't load this product";
    if (subtitleEl) subtitleEl.innerHTML = `Please refresh the page, or <a href="shop.html" style="text-decoration:underline">browse the shop</a>.`;
  }
}

main().catch(console.error);