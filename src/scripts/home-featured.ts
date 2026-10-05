// src/scripts/home-featured.ts
// Homepage "Featured arrangements": real products from the catalog, each linking
// to its product page. Silk first — it is the line the business is leaning into
// (see docs/BUSINESS_VISION.md). Labels state the material plainly.

import { fetchCatalog } from "./db";

const MAX_CARDS = 4;

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
    const all = await fetchCatalog();
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
  } catch (err) {
    console.error("Featured products failed to load:", err);
    if (grid) fallback(grid);
  }
}

main();
