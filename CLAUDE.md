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

- Site is live on Netlify
- Rental schema written and tested; **not yet applied to the live database**
- Redesign files (`Vaniaflorist_Redesign.html`, `shop-redesign.html`,
  `product-redesign.html`, `cart-redesign.html`, `about-redesign.html`) are
  mid-integration
- SEO partially done: meta tags and JSON-LD Florist schema in place.
  Outstanding: Google Business Profile, image alt text, sitemap, Search Console

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
