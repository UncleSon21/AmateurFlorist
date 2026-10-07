-- 003_wedding_enquiries.sql
--
-- `wedding_enquiries` already exists on the live database but was created outside
-- version control (it is not in db.sql or 002_rental.sql). This file records it,
-- and adds the `interest` column so the "I'm interested in" answer from the
-- weddings.html form (custom design vs. hire/buy) is kept — that split is the
-- demand signal the hire model needs.
--
-- Safe to run more than once. On the live database the CREATE is a no-op (the
-- table exists) and only the ALTERs take effect.
--
-- Written by: supabase/functions/submit-wedding-enquiry (service role).

create extension if not exists pgcrypto;

create table if not exists wedding_enquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  partner_name  text,
  email         text not null,
  phone         text,
  wedding_date  text,          -- free text: the form says "an estimate is fine"
  venue         text,
  guest_count   text,
  style         text,
  message       text
);

alter table wedding_enquiries add column if not exists interest text;

-- Holds couples' names, emails and phone numbers: no public access at all.
-- The edge function writes with the service role, which bypasses RLS, so no
-- policies are needed (and none should be added for anon).
alter table wedding_enquiries enable row level security;
