# Vania Florist — Hire repositioning (wording only)

Fresh flowers stay in the business. This is re-weighting, not removal.
Do not delete the Living Collection, the postcode checker, or same-day delivery.

---

## 1. `product-details.html` — REAL BUG, fix first

The care guide tells every customer to trim stems and change water. It renders
on artificial products too (e.g. `artificial-white-orchid-arrangement`, already
in seed data). Make it conditional on `product.material`.

Replace the static `data-tab="care"` block with a container:

```html
<div class="tab-content" data-tab="care">
  <h3>Care Instructions</h3>
  <div id="care-content"></div>
</div>
```

In `src/scripts/product-details.ts`, render based on material:

```ts
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
CARE_GUIDES.artificial = CARE_GUIDES.silk;

document.getElementById("care-content")!.innerHTML =
  CARE_GUIDES[product.material] ?? CARE_GUIDES.fresh;
```

---

## 2. `index.html` — find and replace

| Find | Replace |
|---|---|
| `<a href="weddings.html" class="btn-secondary">View weddings →</a>` | `<a href="weddings.html" class="btn-secondary">Wedding hire →</a>` |
| `<div class="trust-badge-text">Handcrafted Daily</div>` | `<div class="trust-badge-text">Hire or Buy</div>` |
| `<div class="trust-item">Handcrafted Daily</div>` | `<div class="trust-item">Wedding Hire</div>` |
| `<div class="trust-item">Fresh & Artificial</div>` | `<div class="trust-item">Hire or Buy</div>` |

Marquee — both occurrences of each:

| Find | Replace |
|---|---|
| `<span class="marquee-item">Fresh & artificial</span>` | `<span class="marquee-item">Hire or buy</span>` |
| `<span class="marquee-item">Wedding specialists</span>` | `<span class="marquee-item">Wedding bouquet hire</span>` |

Ceremony service card:

| Find | Replace |
|---|---|
| `Wedding flowers by appointment. Fresh, preserved, or both. Tailored to your vision.` | `Wedding flowers to hire or buy. Bridal bouquets, bridesmaids and ceremony pieces — reserved for your date.` |
| `<a href="weddings.html" class="learn-more-btn">Enquire</a>` | `<a href="weddings.html" class="learn-more-btn">View hire collection</a>` |

Search panel category card:

| Find | Replace |
|---|---|
| `<span class="cat-name">Ceremony</span><span class="cat-sub">Wedding flowers</span>` | `<span class="cat-name">Ceremony</span><span class="cat-sub">Wedding hire &amp; purchase</span>` |

Meta description:

| Find | Replace |
|---|---|
| `Vaniaflorist — Sydney's luxury florist. Handcrafted bouquets, wedding flowers, artificial & fresh arrangements. Same-day delivery across Sydney.` | `Vania Florist — Sydney wedding flower hire and keepsake bouquets. Hire or buy bridal bouquets and ceremony pieces. Fresh arrangements with same-day Sydney delivery.` |

Footer tagline:

| Find | Replace |
|---|---|
| `Creating beautiful moments with nature's finest blooms in Sydney.` | `Wedding flower hire and bouquets made to last, in Sydney.` |

Footer collections list — add after the Ceremony line:

```html
<li><a href="weddings.html#hire">Wedding Hire</a></li>
```

---

## 3. `cart.html`

| Find | Replace |
|---|---|
| `Fresh flowers` (trust badge text) | `Hire or buy` |

---

## 4. Reorder collections — Ceremony first

In the nav dropdown and the footer Collections list, reorder to:
Ceremony → Forever → Living. Change link text only if listed above; otherwise
move the existing `<li>` / `<a>` elements without editing them.

---

## 5. New homepage section — "How hire works"

Insert between `<!-- Shop by Occasion Section -->` and `<!-- Best Sellers Section -->`.
Uses existing classes and tokens only. The 2-day / 4-day figures must match
`prep_days_before` and `recovery_days_after` in `002_rental.sql`.

```html
<!-- How Hire Works -->
<section class="shop-by-occasion fade-in-on-scroll" id="how-hire-works">
  <div class="container">
    <p class="section-eyebrow">Wedding Hire</p>
    <h2 class="section-title">Designer bouquets for your day,<br>at a fraction of the price</h2>
    <div class="occasion-grid">
      <div class="occasion-card">
        <div class="occasion-card-content">
          <h3 class="occasion-card-title">1 · Reserve your date</h3>
          <p class="occasion-card-desc">Choose your bouquets and tell us your wedding date. We check availability and hold the pieces for you.</p>
        </div>
      </div>
      <div class="occasion-card">
        <div class="occasion-card-content">
          <h3 class="occasion-card-title">2 · Arrives before the day</h3>
          <p class="occasion-card-desc">Your flowers arrive two days early in a protective case, so there's time to check everything.</p>
        </div>
      </div>
      <div class="occasion-card">
        <div class="occasion-card-content">
          <h3 class="occasion-card-title">3 · Return, or keep it</h3>
          <p class="occasion-card-desc">Send them back within four days and your bond is refunded. Fell in love with it? Keep the bouquet and pay the difference.</p>
        </div>
      </div>
    </div>
    <p style="text-align:center;margin-top:40px;">
      <a href="weddings.html" class="learn-more-btn">Browse the hire collection</a>
    </p>
  </div>
</section>
```

---

## Do NOT change

- Hero headline, `Arrangements from $65`, hero trust line
- Postcode checker / delivery section / `Same-Day Delivery` badge
- The Living Collection or any `material = 'fresh'` product copy
- `styles/styles.css` — every class above already exists
