# Vania Florist

Multi-page static site for a Sydney florist. Built as a gift for the business
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
  business details. Do not attempt to switch it.
- Resend for email
- Deployed to Netlify at `vaniaflorist.netlify.app`

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
  verified. A `.com.au` domain requires an ABN, so this is blocked until the
  owner takes over.
- Root-level files not referenced from HTML (robots, sitemap, OG images) are
  **not deployed**. Put them in `public/`.
- Every page carries its own inline `<style>`; `styles/*.css` is not imported
  anywhere. Header/drawer CSS shared by all pages lives in
  `src/scripts/mobile-nav.ts`.
- Single-column mobile grids must use `minmax(0,1fr)`, not `1fr` — a bare `1fr`
  track grows to its widest child and pushed whole pages past a phone's width.
- Shop filter URLs: `?type=fresh|forever`, `?material=`, `?category=`,
  `?occasion=` (only if that category exists), `?q=`.
- Most phone traffic: check every layout change at 375px and 320px.

## Design system

Use existing tokens and classes. Do not add a CSS framework or new stylesheet.

```
#8b7355  primary (buttons, accents)      #6d5a44  primary hover
#faf8f4  page background                  #c8b89a  gold accent / eyebrows
#1e1a17  headings                         #6b5d54  muted body text
```

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

- Site is live on Netlify (`vaniaflorist.netlify.app`). An identical copy is also
  live at `amateurflorist.vercel.app`; canonical/OG/sitemap URLs point at Netlify.
- The site brands itself **"Amateur Florist"** (commit a2ec499); the repo, Netlify
  site and this file say "Vania". Unresolved — ask before renaming either way.
- Rental schema **is applied** to the live database (`rental_units`,
  `rental_availability`, `products.is_rentable` all respond), but no product is
  marked rentable yet.
- `wedding_enquiries` exists live but was created outside the repo;
  `003_wedding_enquiries.sql` records it and adds `interest`. Run it before
  relying on that column.
- Redesign is integrated; the `*.original-bak` files are the pre-redesign pages.
- SEO: meta + OG tags in place; **no JSON-LD on any page** (needs real business
  address/phone first). Outstanding: Google Business Profile, Search Console.
- Known inconsistencies awaiting the owner: free delivery is **$50** in code
  (cart, checkout, both payment functions) but **$80** in site copy; the product
  page "In Vase +$30" option is switched off because it was never charged.

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
