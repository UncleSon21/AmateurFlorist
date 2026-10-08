# Amateur Florist

Multi-page static site for **Amateur Florist**, a small self-run Sydney florist
just starting to trade (`www.amateurflorist.co`). Built as a gift for the
owner, who will take it over once trading begins.

## Business model

Repositioning from a conventional florist toward **silk/preserved flowers with
wedding hire as the wedge**. Full reasoning in `docs/BUSINESS_VISION.md` — read
it before any copy, pricing, or IA change.

The short version:

- **Wedding hire is the differentiator.** Same bouquet, two ways to earn: hire it
  out repeatedly, or sell it. A piece that doesn't get hired enough gets sold, so
  there is no dead stock — only slow stock.
- **Silk is sold on longevity, never disguised.** Use "silk", "everlasting",
  "keepsake", "made to last". Do NOT write copy that hides the material — the box
  arrives and the customer can tell. Honesty here protects reviews.
  Also keep the words "silk" and "artificial" present for SEO; people search them.
- **Fresh flowers remain in the business.** This is a re-weighting, not a
  removal. Do not delete the Living Collection, the postcode checker, or
  same-day delivery.
- Everyday gifting is a secondary line sharing the same inventory. It should not
  receive build effort ahead of hire.

## Tech stack

- Vite static site, plain HTML + CSS + TypeScript (no framework)
- Supabase (Postgres + Edge Functions), project ref `pflbjnviblravzgvfnvu`
- Stripe — **test mode on purpose**; live activation needs the real owner's
  business details. Do not attempt to switch it. Checkout only shows the card
  form with a `pk_live_` key (`VITE_STRIPE_PUBLISHABLE_KEY`, set in Vercel);
  otherwise it's "Email this order" to chloe@amateurflorist.co. Add `?testpay`
  to the checkout URL to exercise the Stripe test flow.
- Resend for email
- Hosting: **Vercel** only, at `www.amateurflorist.co` (apex redirects to `www`),
  deployed from `master`. Vercel serves `404.html` for unknown URLs with a real
  404 status. `amateurflorist.vercel.app` 301s to `www` (host redirect in
  `vercel.json`): Google had indexed the vercel.app copy first. (Netlify was removed on 2026-10-06; `netlify.toml` is gone.)

## Environment gotchas

These cost real debugging time; don't rediscover them:

- Every new page needs an explicit entry in `vite.config.ts`. Vite will not find
  multi-page HTML on its own.
- `.ts` files must be loaded with `<script type="module" src="...">`. A plain
  script tag silently fails.
- Stripe webhook Edge Functions require `verify_jwt = false` or Stripe's calls
  are rejected.
- `SUPABASE_SERVICE_ROLE_KEY` is auto-injected. Setting it manually as a secret
  fails.
- Resend will not deliver to arbitrary recipients until a custom domain is
  verified. `amateurflorist.co` needs no ABN, so this is now unblocked: add
  Resend's DNS records for it, then set `FROM_EMAIL` to an `@amateurflorist.co`
  address. Public contact address on the site: `chloe@amateurflorist.co`.
- Root-level files not referenced from HTML (robots, sitemap, OG images) are
  **not deployed**. Put them in `public/`.
- Every page carries its own inline `<style>`; `styles/*.css` is not imported
  anywhere. Header/drawer CSS shared by all pages lives in
  `src/scripts/mobile-nav.ts`. The hamburger header is used **below 1024px**
  (the four desktop links don't fit beside the logo on tablets).
- Logo: one drawing, `public/brand/mark.svg#heart`, referenced from every header
  (and the index/about footers) with `<use>`. It is `currentColor`, so it takes
  the season's colour; line weight via the `--sw` custom property. Print/social
  files are in `brand/` (see `brand/README.md`). **No `--` inside SVG comments** —
  it makes the file invalid XML and the external `<use>` silently draws nothing.
- Seasonal decorations (petals, branches, side art) are switched off by the
  owner via the "DEV TOGGLE" CSS blocks; `startParticles` checks that CSS and
  doesn't run its animation loop while hidden. Season colours/hero copy still
  follow the date.
- Night mode follows the clock (18:00–06:00) with **no visitor toggle**: the
  owner removed the floating pill and the menu button. `?night=on|off` previews
  either mode. The per-page pre-paint script and `night-mode.js` must agree.
- Night-mode fireflies are anchored to the page: they scroll away with the
  content (owner's choice). Only a band ~3 screens tall around the viewport is
  drawn, on an absolutely positioned canvas moved with `translateY`; never make
  it page-tall again (it stalled phones). Count is ~8 per screenful on a phone
  (`firefliesAreaPer`), capped by `firefliesTotalMax`.
  `firefliesAnchor: 'screen'` in `public/night-mode.js` brings back the
  viewport-fixed version.
- Site photos in `images/gallery/` have WebP versions (480 / 800 / full) used via
  `<img srcset sizes>`; the JPEG stays as `src`. After adding or replacing a
  photo, run `python tools/make_webp.py` and give its `<img>` a `srcset`. Set
  `sizes` to how wide it really shows (two-up tiles `50vw` on phones, full-width
  `100vw`) or phones download the wrong file.
- The homepage reads products via plain `fetch` to Supabase REST
  (`home-featured.ts`) so it doesn't ship supabase-js (~37 KB gzipped).
- Single-column mobile grids must use `minmax(0,1fr)`, not `1fr` — a bare `1fr`
  track grows to its widest child and pushed whole pages past a phone's width.
- Shop filter URLs: `?type=fresh|forever`, `?material=`, `?category=`,
  `?occasion=` (only if that category exists), `?q=`.
- Homepage "Shop by occasion" cards and the search overlay's occasion pills
  carry `data-occasion="<category name>"` (birthday, anniversary, sympathy,
  new-baby, thank-you, just-because). `home-featured.ts` hides any whose
  category has no products; the section hides if only Wedding is left. Tagging
  a product with that category in Supabase brings the card back.
- Every page loads Vercel Web Analytics with
  `<script defer src="/_vercel/insights/script.js" vite-ignore>` (`vite-ignore`
  stops Vite warning it can't bundle it). Copy it into any new page. It 404s
  until Analytics is switched on in the Vercel project.
- Most phone traffic: check every layout change at 375px and 320px.

## Design system

Use existing tokens and classes. Do not add a CSS framework or new stylesheet.

```
#8b7355  primary (buttons, accents)      #6d5a44  primary hover
#faf8f4  page background                  #c8b89a  gold accent / eyebrows
#1e1a17  headings                         #6b5d54  muted body text
```

- Text colour tokens: use `color:var(--label)` (not `--accent-light`) and
  `color:var(--ink)` (not `--accent`) for text. They equal those colours on
  phones; on desktop (≥1025px) each page's "Desktop readability" block deepens
  them for light backgrounds (4.8:1+ in every season; `--accent-light` alone is
  ~2:1 in summer/autumn) and resets them on dark bands. The same block sets
  desktop body weight 400 and the desktop text sizes. Phones are untouched
  (owner: mobile is good).
- `Cormorant Garamond` — headings, italic pull-quotes
- `Inter` — UI, buttons, eyebrows (uppercase, letter-spacing 2–3px)
- `Great Vibes` — script accents only

Existing classes worth reusing before inventing anything: `.section-eyebrow`,
`.section-title`, `.occasion-grid`, `.occasion-card`, `.learn-more-btn`,
`.btn-primary`, `.btn-secondary`, `.trust-badge-item`, `.fade-in-on-scroll`.

## Rental data model

Schema in `002_rental.sql`, frontend helpers in `src/scripts/rental.ts`.

- **Units, not products, are booked.** `rental_units` holds each physical copy.
  Availability is a count of free units, never a boolean on the product.
- **One wedding day consumes ~7 days of inventory:** `prep_days_before` (2) +
  event + `recovery_days_after` (4). Any customer-facing copy quoting turnaround
  times must match these columns.
- **Enquiries do not reserve stock; confirmation does.** Two couples may enquire
  on the same unit for the same date. Confirming one causes the other's
  confirmation to be rejected by the `no_double_booking` exclusion constraint.
- `rental_availability(product_id, date)` returns a **count only** — never expose
  unit codes or stock levels to the public.
- `rental_unit_economics` is the view that tells you whether the model works.
  A unit not clearing ~2× its cost within a year should be sold, not hired.

## Current state

Checked 2026-10-06:

- Brand is **Amateur Florist** (owner confirmed). "Vania" survives only in the
  local repo folder name.
- Contact and sender address is **`chloe@amateurflorist.co`** (owner's choice).
  It's a free forward to a personal inbox, not a mailbox: nothing to log in to.
- **0414 827 927** is the owner's real phone (confirmed 2026-10-08). It appears
  only in the customer order email (`stripe-webhook`); don't add it to the site
  without asking.
- Rental schema **is applied** to the live database (`rental_units`,
  `rental_availability`, `products.is_rentable` all respond), but no product is
  marked rentable yet.
- The weddings page **Hire collection** (`src/scripts/hire-collection.ts`) lists
  every `is_rentable` product and stays hidden until there is one. Each card's
  Enquire button puts the piece on the enquiry form (`piece`). Owner how-to:
  `docs/HIRE_PIECES.md`.
- `wedding_enquiries` exists live but was created outside the repo;
  `003_wedding_enquiries.sql` records it and adds `interest` and `piece`. Run
  it, then redeploy `submit-wedding-enquiry`, before relying on those columns.
- Redesign is integrated; the `*.original-bak` files are the pre-redesign pages.
- SEO: meta + OG tags in place. The homepage has JSON-LD (`WebSite` +
  `Florist`): name, URL, logo `public/brand/logo-512.png`, email, Instagram
  (`sameAs`), area served Sydney. **No phone and no street address** (owner's
  choice; there is no public address). Outstanding: Google Business Profile,
  Search Console.
- Free delivery threshold is **$50** (owner confirmed) — code and copy agree.
- The product page "In Vase +$30" option is switched off: it was never charged.
- While orders go by email, no page claims "secure checkout", SSL or a "fresh
  guarantee" (none was owner-supplied). The Stripe/SSL line inside checkout's
  card section only shows once card payments are live.
- The redesign mockup shipped invented testimonials, star ratings, "best
  seller" badges, wedding package and à la carte prices, deposit/cancellation
  terms, a Surry Hills studio and street address, opening hours, a team, SMS
  tracking and a referral offer. **The owner confirmed none of it was real**;
  it has been removed.

## Don't

- Don't finish the repositioning and the redesign integration in parallel.
  Land one, ship it, then start the other.
- Don't build the availability calendar, deposit capture, automated reminders,
  or the admin dashboard yet. Hire runs on an enquiry form until real bookings
  prove demand. Building the engine first is the main way this project wastes a
  month.
- Don't switch Stripe out of test mode.
- Don't write care instructions involving water for silk or preserved products.
- Don't invent prices. Ask.
- Don't add testimonials, ratings, team members, addresses, opening hours,
  policies, turnaround promises or offers unless the owner supplies them.
  Placeholder copy from mockups has shipped as fact here before.
