# Adding a piece to the hire collection

The weddings page has a **Hire collection** section. It stays hidden until at
least one product is marked for hire, then appears on its own. Nothing needs
deploying: it reads the products table every time the page loads.

## Mark a product for hire

In Supabase, open **Table Editor → `products`**, find the bouquet, and set:

| Column | What to enter |
|---|---|
| `is_rentable` | `true` |
| `rental_price_cents` | Hire price **in cents**: $150 is `15000`. Leave empty to show "Hire price on request". |
| `deposit_cents` | Refundable bond in cents. Leave empty and no bond is shown. |
| `is_purchasable` | `true` if it's also for sale. The card then shows "Or buy it from $X" (its cheapest size in `variants`) and a **Buy it** link. `false` for hire only. |

The card uses the product's first photo (lowest `sort_order` in `product_images`).

To take a piece out of the collection, set `is_rentable` back to `false`.

## Record each physical copy

Add one row to **`rental_units`** for every copy you own, e.g. `unit_code`
`BQ-WHITE-01`, with `cost_cents` set to what it cost you. The website doesn't
need this to show the piece. It's how `rental_unit_economics` tells you whether
hiring it pays back: a piece not earning about twice its cost within a year is
better sold than hired.

## What happens when a couple taps Enquire

The enquiry form opens with "A ready-made bouquet, to hire or buy" selected and
the piece's name shown. Your notification email has a **Piece** row, and its
subject line ends with the piece name. It's also saved in the
`wedding_enquiries.piece` column once `003_wedding_enquiries.sql` has been run.

An enquiry doesn't reserve anything. You reply, agree the date, and confirm by
hand.

## Keep the timing copy in step

The weddings page says hire bouquets **arrive two days early**, go **back within
four days**, and must be **booked at least two weeks ahead**. Those match the
product columns `prep_days_before` (2), `recovery_days_after` (4) and
`min_lead_days` (14). If you change those columns, change that copy too.
