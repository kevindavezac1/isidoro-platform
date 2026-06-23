'use server'

import { redirect } from 'next/navigation'

// TODO: replace bodies with Supabase calls when Kevin publishes /rest/v1/time_offers
// and /rest/v1/time_offer_products (with price_override — see DEC-020)

export async function createTimeOffer(_formData: FormData) {
  redirect('/admin/ofertas?success=created')
}

export async function updateTimeOffer(id: string, _formData: FormData) {
  void id
  redirect('/admin/ofertas?success=updated')
}

export async function deleteTimeOffer(id: string) {
  void id
  redirect('/admin/ofertas?success=deleted')
}
