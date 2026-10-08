-- 004_order_requests.sql
--
-- Orders placed at checkout while online payment isn't open. The customer's
-- order is sent by the `submit-order-request` edge function, which checks the
-- prices against the products table, saves it here and emails it to the owner.
-- The owner then contacts the customer to confirm and arrange payment.
--
-- This replaces "Email this order" (which needed the customer's email app and
-- silently did nothing without one). Nothing here takes payment.
--
-- Safe to run more than once. Run in Supabase → SQL Editor, then deploy
-- supabase/functions/submit-order-request.

create extension if not exists pgcrypto;

create table if not exists order_requests (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique not null
                  default 'AF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at      timestamptz not null default now(),
  status          text not null default 'new'
                  check (status in ('new', 'confirmed', 'paid', 'delivered', 'cancelled')),
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  is_pickup       boolean not null default false,
  delivery_date   date not null,
  delivery_time   text,
  address         text,              -- null for pickup
  notes           text,              -- card message / notes
  items           jsonb not null,    -- [{ name, variant, qty, unit_cents, line_cents, product_id, variant_code }]
  subtotal_cents  int not null check (subtotal_cents >= 0),
  delivery_cents  int not null check (delivery_cents >= 0),
  total_cents     int not null check (total_cents >= 0)
);

create index if not exists order_requests_created_idx on order_requests (created_at desc);

-- Customers' names, phones and addresses: no public access at all. The edge
-- function writes with the service role, which bypasses RLS, so no policies.
alter table order_requests enable row level security;
