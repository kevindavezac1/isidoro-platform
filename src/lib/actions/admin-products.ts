'use server'

import { redirect } from 'next/navigation'

// TODO: replace all redirect-only bodies with real Supabase calls
// when Kevin publishes POST/PATCH/DELETE /rest/v1/products

export async function createProduct(_formData: FormData) {
  // TODO: const supabase = await createClient()
  // TODO: await supabase.from('products').insert({ name, category_id, description, price, is_available, sort_order })
  redirect('/admin/productos?success=created')
}

export async function updateProduct(id: string, _formData: FormData) {
  // TODO: const supabase = await createClient()
  // TODO: await supabase.from('products').update({ name, category_id, description, price, is_available, sort_order }).eq('id', id)
  redirect('/admin/productos?success=updated')
}

export async function deleteProduct(id: string) {
  // TODO: const supabase = await createClient()
  // TODO: await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  void id
  redirect('/admin/productos?success=deleted')
}
