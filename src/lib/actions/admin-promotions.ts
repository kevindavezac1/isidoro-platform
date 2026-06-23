'use server'

import { redirect } from 'next/navigation'

// TODO: replace bodies with Supabase calls when Kevin publishes /rest/v1/promotions

export async function createPromotion(_formData: FormData) {
  redirect('/admin/promociones?success=created')
}

export async function updatePromotion(id: string, _formData: FormData) {
  void id
  redirect('/admin/promociones?success=updated')
}

export async function deletePromotion(id: string) {
  void id
  redirect('/admin/promociones?success=deleted')
}
