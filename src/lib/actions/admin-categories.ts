'use server'

import { redirect } from 'next/navigation'

// TODO: replace all redirect-only bodies with real Supabase calls
// when Kevin publishes POST/PATCH/DELETE /rest/v1/categories

export async function createCategory(_formData: FormData) {
  redirect('/admin/categorias?success=created')
}

export async function updateCategory(id: string, _formData: FormData) {
  void id
  redirect('/admin/categorias?success=updated')
}

export async function deleteCategory(id: string) {
  void id
  redirect('/admin/categorias?success=deleted')
}
