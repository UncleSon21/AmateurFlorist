// src/scripts/home-featured.ts
// Homepage "Featured arrangements": real products from the catalog, each linking
// to its product page. Silk first — it is the line the business is leaning into
// (see docs/BUSINESS_VISION.md). Labels state the material plainly.

// The homepage only reads a handful of products, so it calls Supabase's REST API
// directly instead of importing supabase-js (~140 KB, 37 KB gzipped) on the page
// most phone visitors land on. Same env vars as db.ts.
// @ts-ignore
const SUPABASE_URL: string = (window as any).SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const SUPABASE_ANON_KEY: string = (window as any).SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const MAX_CARDS = 4;

type Product = {
  id: string; name: string; material: string; inStock: boolean;
  images: string[]; variants: { priceCents: number }[]; categories: string[];
};

async function fetchProducts(): Promise<Product[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const select = "id,name,material,in_stock,product_images(image_url,sort_order),variants(price_cents),"
    + "product_categories(categories(name))";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=${encodeURIComponent(select)}&order=name.asc`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`products request failed: ${res.status}`);
  const rows: any[] = await res.json();
  return rows.map(p => ({
    id: p.id,
    name: p.name,
    material: p.material,
    inStock: p.in_stock,
    images: (p.product_images || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((x: any) => x.image_url),
    variants: (p.variants || []).map((v: any) => ({ priceCents: v.price_cents })),
    categories: (p.product_categories || [])
      .map((pc: any) => pc.categories?.name)
      .filter(Boolean),
  }));
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatFrom(cents: number): string {
  const dollars = cents / 100;
  return `From $${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

function card(p: any): string {
  const silk = p.material !== "fresh";
  const minCents = Math.min(...p.variants.map((v: any) => v.priceCents));
  const img = p.images?.[0];
  return `
    <a href="product-details.html?id=${encodeURIComponent(p.id)}" class="prod-card">
      <div class="prod-img">
        ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : ""}
        <span class="type-badge ${silk ? "type-forever" : "type-fresh"}">${silk ? "Silk" : "Fresh"}</span>
      </div>
      <div class="prod-body">
        <h3 class="prod-name">${esc(p.name)}</h3>
        <p class="prod-type">${silk ? "Silk · made to last" : "Fresh flowers"}</p>
        <div class="prod-foot"><span class="prod-price">${formatFrom(minCents)}</span></div>
      </div>
    </a>`;
}

// Compact row for the search overlay's "From the collection" list.
function overlayRow(p: any): string {
  const silk = p.material !== "fresh";
  const minCents = Math.min(...p.variants.map((v: any) => v.priceCents));
  const img = p.images?.[0];
  return `
    <a class="vs-trending-card" href="product-details.html?id=${encodeURIComponent(p.id)}">
      <div class="vs-trending-img"${img ? ` style="background-image:url('${esc(img)}')"` : ""}></div>
      <div class="vs-trending-meta">
        <p class="vs-trending-name">${esc(p.name)}</p>
        <p class="vs-trending-price">${formatFrom(minCents)} · ${silk ? "Silk" : "Fresh"}</p>
      </div>
    </a>`;
}

// "Shop by occasion": hide every occasion card and search-overlay pill whose
// category has no products, so none of them opens an empty or unfiltered shop.
// The owner brings one back by tagging a product with that category in Supabase
// (category name = the data-occasion slug, e.g. "anniversary", "new-baby").
// If the products request fails, nothing is hidden: ?occasion= falls back to
// the full shop.
function syncOccasions(all: Product[]) {
  const stocked = new Set(all.flatMap(p => p.categories));
  document.querySelectorAll<HTMLElement>("[data-occasion]").forEach(el => {
    el.hidden = !stocked.has(el.dataset["occasion"] || "");
  });

  const grid = document.querySelector<HTMLElement>(".occasions-grid");
  if (grid) {
    const cards = [...grid.querySelectorAll<HTMLElement>(".occ-card")].filter(c => !c.hidden);
    // Only the Wedding card left: no occasion has products yet, so drop the section.
    const section = grid.closest<HTMLElement>("section");
    if (section) section.hidden = !cards.some(c => c.dataset["occasion"]);
    grid.classList.toggle("occ-two-col", cards.length === 2 || cards.length === 4);
  }

  const pills = document.querySelector<HTMLElement>(".vs-occasions");
  if (pills && !pills.querySelector("[data-occasion]:not([hidden])")) {
    pills.hidden = true;
    const heading = pills.previousElementSibling as HTMLElement | null;
    if (heading?.classList.contains("vs-section-title")) heading.hidden = true;
  }
}

function fallback(grid: HTMLElement) {
  grid.innerHTML = `
    <p style="grid-column:1/-1;text-align:center">
      <a href="shop.html" class="btn-dark" style="display:inline-flex">Browse the collection →</a>
    </p>`;
}

async function main() {
  const grid = document.getElementById("featured-grid");
  const overlay = document.getElementById("vs-trending");
  if (!grid && !overlay) return;
  try {
    const all = await fetchProducts();
    syncOccasions(all);
    const featured = all
      .filter((p: any) => p.inStock && p.variants.length > 0)
      .sort((a: any, b: any) =>
        Number(a.material === "fresh") - Number(b.material === "fresh") ||
        a.name.localeCompare(b.name))
      .slice(0, MAX_CARDS);
    if (grid) {
      if (featured.length) grid.innerHTML = featured.map(card).join("");
      else fallback(grid);
    }
    if (overlay) overlay.innerHTML = featured.map(overlayRow).join("");

    // Hero "Arrangements from $X": the real lowest in-stock price, never a
    // hard-coded one (it said $65 when the cheapest product was $79).
    const heroFrom = document.getElementById("hero-from");
    const prices = all
      .filter((p: any) => p.inStock)
      .flatMap((p: any) => p.variants.map((v: any) => v.priceCents));
    if (heroFrom && prices.length) {
      heroFrom.textContent = `Arrangements ${formatFrom(Math.min(...prices)).toLowerCase()}`;
    }
  } catch (err) {
    console.error("Featured products failed to load:", err);
    if (grid) fallback(grid);
  }
}

main();
