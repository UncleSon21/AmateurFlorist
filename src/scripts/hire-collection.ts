// src/scripts/hire-collection.ts
// Weddings page "Hire collection": every product marked is_rentable, with its
// hire price, refundable bond and (if it's also for sale) a buy link. Each card's
// "Enquire" button fills the enquiry form with that piece, so the owner knows
// exactly which bouquet the couple means.
//
// Hire runs on enquiries only (see CLAUDE.md): no calendar, no availability
// check, no deposit. Prices come from the database; a piece without a hire
// price says "on request" rather than showing a made-up number. The section
// stays hidden until at least one product is marked rentable.
//
// Plain REST fetch like home-featured.ts, so this page doesn't ship supabase-js.
// @ts-ignore
const SUPABASE_URL: string = (window as any).SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const SUPABASE_ANON_KEY: string = (window as any).SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const HIRE_INTEREST = "A ready-made bouquet, to hire or buy";

type HirePiece = {
  id: string;
  name: string;
  material: string;
  image: string | null;
  rentalPriceCents: number | null;
  depositCents: number | null;
  buyFromCents: number | null;   // cheapest variant, only if it's also for sale
};

async function fetchHirePieces(): Promise<HirePiece[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const select = "id,name,material,is_purchasable,rental_price_cents,deposit_cents,"
    + "product_images(image_url,sort_order),variants(price_cents)";
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=${encodeURIComponent(select)}&is_rentable=eq.true&order=name.asc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );
  if (!res.ok) throw new Error(`hire collection request failed: ${res.status}`);
  const rows: any[] = await res.json();
  return rows.map(p => {
    const images = (p.product_images || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((x: any) => x.image_url);
    const prices = (p.variants || []).map((v: any) => v.price_cents).filter((c: any) => c > 0);
    return {
      id: p.id,
      name: p.name,
      material: p.material,
      image: images[0] ?? null,
      rentalPriceCents: p.rental_price_cents,
      depositCents: p.deposit_cents,
      buyFromCents: p.is_purchasable !== false && prices.length ? Math.min(...prices) : null,
    };
  });
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function money(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

function materialLabel(m: string): string {
  if (m === "fresh") return "Fresh";
  if (m === "preserved") return "Preserved";
  return "Silk";   // 'silk' and 'artificial' are both shown as silk on the site
}

function card(p: HirePiece): string {
  const hire = p.rentalPriceCents != null
    ? `Hire <strong>${money(p.rentalPriceCents)}</strong>`
    : "Hire price on request";
  return `
    <article class="piece-card hire-card">
      <div class="piece-img">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : ""}
      </div>
      <div class="piece-body">
        <p class="hire-material">${materialLabel(p.material)}</p>
        <h3 class="piece-name">${esc(p.name)}</h3>
        <p class="hire-price">${hire}</p>
        ${p.depositCents ? `<p class="piece-from">Refundable bond ${money(p.depositCents)}</p>` : ""}
        ${p.buyFromCents != null ? `<p class="piece-from">Or buy it from ${money(p.buyFromCents)}</p>` : ""}
        <div class="hire-actions">
          <a href="#enquire" class="btn-dark hire-enquire" data-piece="${esc(p.name)}" aria-label="Enquire about ${esc(p.name)}">Enquire</a>
          ${p.buyFromCents != null
            ? `<a href="product-details.html?id=${encodeURIComponent(p.id)}" class="btn-ghost" aria-label="Buy ${esc(p.name)}">Buy it</a>`
            : ""}
        </div>
      </div>
    </article>`;
}

// Put a piece on the enquiry form (or take it off with name = "").
function setPiece(name: string): void {
  const input = document.getElementById("enq-piece") as HTMLInputElement | null;
  const row = document.getElementById("enq-piece-row");
  const label = document.getElementById("enq-piece-name");
  if (!input || !row || !label) return;
  input.value = name;
  label.textContent = name;
  row.hidden = !name;
  if (name) {
    const interest = document.getElementById("enq-interest") as HTMLSelectElement | null;
    if (interest) interest.value = HIRE_INTEREST;
  }
}

async function initHireCollection(): Promise<void> {
  const section = document.getElementById("hire-collection");
  const grid = document.getElementById("hire-grid");
  if (!section || !grid) return;

  document.getElementById("enq-piece-clear")?.addEventListener("click", () => setPiece(""));
  // The form script clears the piece after a successful send.
  window.addEventListener("enquiry:sent", () => setPiece(""));

  let pieces: HirePiece[] = [];
  try {
    pieces = await fetchHirePieces();
  } catch (err) {
    console.warn("Hire collection unavailable:", err);
    return;
  }
  if (!pieces.length) return;   // nothing marked rentable yet: keep the section hidden

  grid.innerHTML = pieces.map(card).join("");
  section.hidden = false;

  grid.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".hire-enquire");
    if (btn) setPiece(btn.dataset["piece"] || "");
  });

  // Path 02's "Browse hire & buy" now has something to browse.
  document.querySelectorAll<HTMLAnchorElement>(`a[data-prefill-interest="${HIRE_INTEREST}"]`)
    .forEach(a => { a.href = "#hire-collection"; });
}

initHireCollection();
