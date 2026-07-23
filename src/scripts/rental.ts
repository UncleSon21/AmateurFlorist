// src/scripts/rental.ts
// Hire availability + enquiry capture. Pairs with 002_rental.sql.

import { supabase } from "./db";

export type RentalProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  rentalPriceCents: number | null;
  depositCents: number | null;
  minLeadDays: number;
  isPurchasable: boolean;
};

/** Products available to hire. */
export async function fetchRentalCatalog(): Promise<RentalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, slug, name, description,
      rental_price_cents, deposit_cents, min_lead_days, is_purchasable,
      product_images ( image_url, sort_order )
    `)
    .eq("is_rentable", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    rentalPriceCents: p.rental_price_cents,
    depositCents: p.deposit_cents,
    minLeadDays: p.min_lead_days ?? 14,
    isPurchasable: p.is_purchasable ?? true,
    images: (p.product_images ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((x: any) => x.image_url),
  }));
}

/**
 * How many units are free for a given date.
 * Returns a count only — stock levels and unit codes are never exposed.
 * eventDate must be 'YYYY-MM-DD'.
 */
export async function checkAvailability(
  productId: string,
  eventDate: string
): Promise<number> {
  const { data, error } = await supabase.rpc("rental_availability", {
    p_product_id: productId,
    p_event_date: eventDate,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Check several products against one date (e.g. a whole wedding package). */
export async function checkPackageAvailability(
  productIds: string[],
  eventDate: string
): Promise<Record<string, number>> {
  const results = await Promise.all(
    productIds.map(async (id) => [id, await checkAvailability(id, eventDate)] as const)
  );
  return Object.fromEntries(results);
}

export type EnquiryDraft = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  eventDate: string;      // YYYY-MM-DD
  eventType?: string;
  venue?: string;
  notes?: string;
};

/**
 * Creates an enquiry. Deliberately does NOT reserve stock —
 * an enquiry is a lead, not a booking. Staff confirm it manually,
 * which is the step that actually blocks the calendar.
 *
 * Goes through the `create_rental_enquiry` SECURITY DEFINER RPC rather than a
 * direct insert: rental_bookings has no anon SELECT policy (it holds other
 * customers' contact details), so an insert().select() would save the row but
 * fail to read booking_ref back under RLS. The RPC inserts and returns the ref.
 */
export async function submitEnquiry(draft: EnquiryDraft): Promise<string> {
  const { data, error } = await supabase.rpc("create_rental_enquiry", {
    p_customer_name: draft.customerName,
    p_customer_email: draft.customerEmail,
    p_customer_phone: draft.customerPhone ?? null,
    p_event_date: draft.eventDate,
    p_event_type: draft.eventType ?? "wedding",
    p_venue: draft.venue ?? null,
    p_notes: draft.notes ?? null,
  });

  if (error) throw error;
  return data as string;
}

/** Earliest bookable date, as YYYY-MM-DD, for setting <input type="date" min>. */
export function earliestBookableDate(minLeadDays: number): string {
  // Compute in UTC so this matches the SQL guard exactly: rental_availability
  // rejects dates < current_date + min_lead_days, and Supabase evaluates
  // current_date in UTC. Local date arithmetic here could drift a day across a
  // Sydney DST transition and offer a `min` the SQL then rejects.
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + minLeadDays);
  return d.toISOString().slice(0, 10);
}

export function formatHirePrice(
  rentalCents: number | null,
  depositCents: number | null
): string {
  // A rentable product may not be priced yet (both columns are nullable).
  // Never advertise an unpriced item as a free "$0" hire.
  if (rentalCents == null || depositCents == null) return "Price on request";
  const f = (c: number) => `$${(c / 100).toFixed(0)}`;
  return `${f(rentalCents)} hire + ${f(depositCents)} refundable bond`;
}
