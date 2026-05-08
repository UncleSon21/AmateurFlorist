// src/scripts/shop_page_db.ts — FIXED VERSION
// ✅ Reads URL params: ?category=, ?material=, ?q= to pre-filter on page load

import { fetchCatalog } from "./db";
import { qs, qsa } from "./utils";
import { loadCart, mountCartDrawer } from "./cart";

type MaterialFilter = "all" | "fresh" | "artificial";

function updateNavCount() {
  const cart = loadCart();
  const total = cart.reduce((s, ci) => s + ci.qty, 0);
  const el = qs<HTMLElement>("#nav-cart-count");
  if (el) el.textContent = String(total);
}

function renderGrid(list: any[]) {
  const grid = qs<HTMLDivElement>("#productsGrid");
  if (!grid) return;

  const countEl = qs<HTMLElement>("#resultsCount");
  if (countEl) {
    countEl.innerHTML = list.length > 0
      ? `<span>${list.length}</span> result${list.length !== 1 ? "s" : ""}`
      : "";
  }

  if (list.length === 0) {
    grid.innerHTML = `<div class="shop-empty"><div class="shop-empty-icon">🌸</div><h3>No flowers found</h3><p>Try adjusting your filters or search term.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const minPrice = Math.min(...p.variants.map((v: any) => v.priceCents)) / 100;
    const img = p.images?.[0] || "";
    const materialClass = p.material === "fresh" ? "fresh" : "artificial";
    const materialLabel = p.material === "fresh" ? "Fresh" : "Artificial";
    const href = `product-details.html?id=${p.id}`;
    return `
      <a class="prod-card product-card" href="${href}" data-product-id="${p.id}">
        <div class="prod-img product-image">
          ${img ? `<img loading="lazy" src="${img}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.removeProperty('display')">` : ""}
          <div class="product-image-placeholder" ${img ? 'style="display:none"' : ""}>
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.35">
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(0 32 32)"/>
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(60 32 32)"/>
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(120 32 32)"/>
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(180 32 32)"/>
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(240 32 32)"/>
              <ellipse cx="32" cy="20" rx="8" ry="12" fill="#c8a882" transform="rotate(300 32 32)"/>
              <circle cx="32" cy="32" r="7" fill="#e8c9a0"/>
            </svg>
            <span>Photo coming soon</span>
          </div>
          <span class="material-badge mat-badge ${materialClass}">${materialLabel}</span>
          <div class="prod-overlay"><span class="quick-view">Quick view</span></div>
        </div>
        <div class="prod-body product-info">
          <h3 class="prod-name product-title">${p.name}</h3>
          <p class="prod-desc product-description">${p.description || ""}</p>
          <div class="prod-footer product-footer">
            <div class="prod-price-wrap product-price-wrap">
              <span class="prod-price-from product-price-label">From</span>
              <span class="prod-price product-price">$${minPrice.toFixed(2)}</span>
            </div>
            <span class="view-details-btn">Shop Now →</span>
          </div>
        </div>
      </a>`;
  }).join("");
}

async function main() {
  updateNavCount();
  document.addEventListener("cart:changed", updateNavCount);

  const all = await fetchCatalog();

  // ✅ FIX: Read URL params to pre-filter
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get("category") || "all";
  const urlMaterial = params.get("material") || "all";
  const urlSearch   = params.get("q") || "";

  const categorySel = qs<HTMLSelectElement>("#categorySelect");
  if (categorySel) {
    const cats = [...new Set(all.flatMap((p: any) => p.categories))].filter(Boolean).sort() as string[];
    categorySel.innerHTML = `<option value="all">All Categories</option>` +
      cats.map(c => `<option value="${c}"${c === urlCategory ? " selected" : ""}>${(c as string).charAt(0).toUpperCase() + (c as string).slice(1)}</option>`).join("");
  }

  let material: MaterialFilter = (urlMaterial === "fresh" || urlMaterial === "artificial") ? urlMaterial : "all";
  let category = urlCategory;
  let q = urlSearch.toLowerCase();

  // Pre-set the search input
  const searchInput = qs<HTMLInputElement>("#searchInput");
  if (searchInput && urlSearch) {
    searchInput.value = urlSearch;
  }

  // Pre-set the material pill
  if (material !== "all") {
    qsa<HTMLButtonElement>(".material-pill").forEach(btn => {
      btn.classList.toggle("active", btn.dataset["material"] === material);
    });
  }

  const apply = () => {
    const list = all.filter((p: any) => {
      const okMaterial = material === "all" || p.material === material;
      const okCat      = category === "all" || p.categories.includes(category);
      const okQ        = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      return okMaterial && okCat && okQ;
    });
    renderGrid(list);
  };

  qsa<HTMLButtonElement>(".material-pill").forEach(btn =>
    btn.addEventListener("click", () => {
      material = (btn.dataset["material"] as MaterialFilter) || "all";
      qsa<HTMLButtonElement>(".material-pill").forEach(b => b.classList.toggle("active", b === btn));
      apply();
    })
  );

  categorySel?.addEventListener("change", () => { category = categorySel.value || "all"; apply(); });

  searchInput?.addEventListener("input", e => {
    q = (e.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    apply();
  });

  apply();
  mountCartDrawer();
}

main().catch(console.error);