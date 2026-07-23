-- ============================================================
-- 002_rental.sql — Vania Florist: silk bouquet hire model
-- Purely additive. Does not modify or drop existing tables.
-- Run in Supabase → SQL Editor.
-- ============================================================

create extension if not exists btree_gist;   -- required for the no-double-booking constraint
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Allow silk/preserved as materials
-- ------------------------------------------------------------
alter table products drop constraint if exists products_material_check;
alter table products add constraint products_material_check
  check (material in ('fresh','artificial','silk','preserved'));

-- ------------------------------------------------------------
-- 2. Rental config on products
--    prep/recovery days are why one wedding day costs you a week
--    of inventory. Model it now or your calendar will lie to you.
-- ------------------------------------------------------------
alter table products
  add column if not exists is_rentable         boolean  not null default false,
  add column if not exists is_purchasable      boolean  not null default true,
  add column if not exists rental_price_cents  int      check (rental_price_cents  >= 0),
  add column if not exists deposit_cents       int      check (deposit_cents       >= 0),
  add column if not exists prep_days_before    smallint not null default 2,   -- pack + dispatch
  add column if not exists recovery_days_after smallint not null default 4,   -- return + inspect + repair
  add column if not exists min_lead_days       smallint not null default 14;  -- earliest bookable

-- ------------------------------------------------------------
-- 3. Physical units
--    THE key table. You may own 4 copies of one bouquet; each is
--    independently bookable. Availability lives here, not on products.
-- ------------------------------------------------------------
create table if not exists rental_units (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete restrict,
  unit_code    text unique not null,                      -- e.g. 'BQ-WHTGRN-02'
  status       text not null default 'available'
               check (status in ('available','in_repair','retired','sold')),
  condition    text not null default 'excellent'
               check (condition in ('excellent','good','fair','needs_repair')),
  acquired_on  date default current_date,
  cost_cents   int  check (cost_cents >= 0),              -- for payback tracking
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists rental_units_product_idx
  on rental_units(product_id) where status = 'available';

-- ------------------------------------------------------------
-- 4. Bookings
-- ------------------------------------------------------------
create table if not exists rental_bookings (
  id                  uuid primary key default gen_random_uuid(),
  booking_ref         text unique not null
                      default 'VF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  customer_name       text not null,
  customer_email      text not null,
  customer_phone      text,
  event_date          date not null,
  event_type          text,                                -- wedding / engagement / other
  venue               text,
  status              text not null default 'enquiry'
                      check (status in ('enquiry','quoted','confirmed','dispatched',
                                        'returned','inspected','closed','cancelled','declined')),
  rental_total_cents  int  not null default 0,
  deposit_total_cents int  not null default 0,
  deposit_status      text not null default 'none'
                      check (deposit_status in ('none','held','captured','released','partial')),
  stripe_payment_intent_id text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists rental_bookings_event_idx on rental_bookings(event_date);
create index if not exists rental_bookings_status_idx on rental_bookings(status);

-- ------------------------------------------------------------
-- 5. Booking line items + double-booking prevention
--    The EXCLUDE constraint makes double-booking physically
--    impossible at the database level. No race conditions,
--    no matter how bad the frontend is.
-- ------------------------------------------------------------
create table if not exists rental_booking_items (
  id                  bigserial primary key,
  booking_id          uuid not null references rental_bookings(id) on delete cascade,
  unit_id             uuid not null references rental_units(id)    on delete restrict,
  reserved_period     daterange not null,          -- set by trigger, do not write directly
  blocks_calendar     boolean   not null default false,
  rental_price_cents  int not null default 0,
  deposit_cents       int not null default 0,
  converted_to_sale   boolean not null default false,   -- "buy instead of returning"
  sale_price_cents    int,
  return_condition    text,
  damage_notes        text,
  damage_charge_cents int not null default 0,

  constraint no_double_booking
    exclude using gist (unit_id with =, reserved_period with &&)
    where (blocks_calendar)
);

create index if not exists rental_items_booking_idx on rental_booking_items(booking_id);

-- ------------------------------------------------------------
-- 6. Derive reserved_period + blocks_calendar automatically
--    Enquiries and quotes deliberately do NOT block the calendar —
--    otherwise one spam enquiry locks out a paying couple.
-- ------------------------------------------------------------
create or replace function rental_item_sync()
returns trigger language plpgsql as $$
declare
  v_event date; v_status text; v_before smallint; v_after smallint;
begin
  select b.event_date, b.status into v_event, v_status
    from rental_bookings b where b.id = new.booking_id;

  select p.prep_days_before, p.recovery_days_after into v_before, v_after
    from rental_units u join products p on p.id = u.product_id
   where u.id = new.unit_id;

  new.reserved_period := daterange(v_event - v_before, v_event + v_after, '[]');
  new.blocks_calendar := v_status in
    ('confirmed','dispatched','returned','inspected','closed');
  return new;
end $$;

drop trigger if exists trg_rental_item_sync on rental_booking_items;
create trigger trg_rental_item_sync
  before insert or update on rental_booking_items
  for each row execute function rental_item_sync();

-- Re-sync items when a booking's status or date changes
create or replace function rental_booking_after_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     or new.event_date is distinct from old.event_date then
    update rental_booking_items
       set blocks_calendar = blocks_calendar   -- no-op write; fires the sync trigger
     where booking_id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists trg_rental_booking_after_update on rental_bookings;
create trigger trg_rental_booking_after_update
  after update on rental_bookings
  for each row execute function rental_booking_after_update();

create or replace function rental_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_rental_touch on rental_bookings;
create trigger trg_rental_touch
  before update on rental_bookings
  for each row execute function rental_touch_updated_at();

-- ------------------------------------------------------------
-- 7. Public availability check
--    Returns a COUNT only — never exposes unit codes or how much
--    stock you hold.
-- ------------------------------------------------------------
create or replace function rental_availability(p_product_id uuid, p_event_date date)
returns int
language sql stable security definer set search_path = public as $$
  with cfg as (
    select prep_days_before, recovery_days_after, min_lead_days, is_rentable
      from products where id = p_product_id
  ), win as (
    select daterange(p_event_date - prep_days_before,
                     p_event_date + recovery_days_after, '[]') as w from cfg
  )
  select case
    when not (select is_rentable from cfg) then 0
    when p_event_date < current_date + (select min_lead_days from cfg) then 0
    else (
      select count(*)::int from rental_units u, win
       where u.product_id = p_product_id
         and u.status = 'available'
         and not exists (
           select 1 from rental_booking_items i
            where i.unit_id = u.id
              and i.blocks_calendar
              and i.reserved_period && win.w
         )
    )
  end;
$$;

-- Staff-side: which specific units are free
create or replace function rental_free_units(p_product_id uuid, p_event_date date)
returns table (unit_id uuid, unit_code text, condition text)
language sql stable security definer set search_path = public as $$
  with win as (
    select daterange(p_event_date - p.prep_days_before,
                     p_event_date + p.recovery_days_after, '[]') as w
      from products p where p.id = p_product_id
  )
  select u.id, u.unit_code, u.condition
    from rental_units u, win
   where u.product_id = p_product_id
     and u.status = 'available'
     and not exists (
       select 1 from rental_booking_items i
        where i.unit_id = u.id and i.blocks_calendar and i.reserved_period && win.w
     )
   order by (
     select count(*) from rental_booking_items i2
      where i2.unit_id = u.id and i2.blocks_calendar
   ) asc, u.unit_code asc;   -- rotate stock evenly: least-rented unit first
$$;

-- ------------------------------------------------------------
-- 7b. Public enquiry capture
--    An enquiry is a lead, not a booking — it never reserves stock
--    (blocks_calendar stays false until staff confirm). Runs as
--    SECURITY DEFINER so the public can create a lead and get its
--    booking_ref back WITHOUT any SELECT access to rental_bookings,
--    which holds other customers' contact details. A plain
--    insert().select() under RLS would save the row but fail to read
--    the ref back, throwing on every enquiry — hence this RPC.
-- ------------------------------------------------------------
create or replace function create_rental_enquiry(
  p_customer_name  text,
  p_customer_email text,
  p_event_date     date,
  p_customer_phone text default null,
  p_event_type     text default 'wedding',
  p_venue          text default null,
  p_notes          text default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
begin
  if p_customer_name is null or length(btrim(p_customer_name)) = 0 then
    raise exception 'customer name is required';
  end if;
  if p_customer_email is null
     or p_customer_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'a valid customer email is required';
  end if;
  if p_event_date is null or p_event_date < current_date then
    raise exception 'event date must be today or later';
  end if;

  insert into rental_bookings
    (customer_name, customer_email, customer_phone,
     event_date, event_type, venue, notes, status)
  values
    (btrim(p_customer_name), lower(btrim(p_customer_email)), p_customer_phone,
     p_event_date, coalesce(nullif(btrim(p_event_type), ''), 'wedding'),
     p_venue, p_notes, 'enquiry')
  returning booking_ref into v_ref;

  return v_ref;
end $$;

grant execute on function
  create_rental_enquiry(text, text, date, text, text, text, text)
  to anon, authenticated;

-- ------------------------------------------------------------
-- 8. Utilisation reporting — the number that decides whether
--    this business model actually works.
-- ------------------------------------------------------------
create or replace view rental_unit_economics as
select
  p.name,
  u.unit_code,
  u.cost_cents,
  count(i.id) as times_rented,
  coalesce(sum(i.rental_price_cents), 0) as revenue_cents,
  coalesce(sum(i.rental_price_cents), 0) - coalesce(u.cost_cents, 0) as net_cents,
  case when coalesce(u.cost_cents,0) > 0
       then round(coalesce(sum(i.rental_price_cents),0)::numeric / u.cost_cents, 2)
  end as payback_multiple
from rental_units u
join products p on p.id = u.product_id
left join rental_booking_items i
       on i.unit_id = u.id and i.blocks_calendar
group by p.name, u.unit_code, u.cost_cents;

-- ------------------------------------------------------------
-- 9. RLS
-- ------------------------------------------------------------
alter table rental_units          enable row level security;
alter table rental_bookings       enable row level security;
alter table rental_booking_items  enable row level security;

-- No public policies on rental_units / rental_booking_items:
-- the public only ever sees availability via rental_availability().

drop policy if exists "Anon create enquiry" on rental_bookings;
create policy "Anon create enquiry" on rental_bookings
  for insert with check (
    status = 'enquiry'
    and deposit_status = 'none'
    and rental_total_cents = 0
    and event_date >= current_date
  );

grant execute on function rental_availability(uuid, date) to anon, authenticated;
revoke execute on function rental_free_units(uuid, date) from anon;
