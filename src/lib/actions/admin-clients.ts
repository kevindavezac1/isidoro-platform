'use server'

import { redirect } from 'next/navigation'

// TODO: replace with Supabase insert into points_transactions (type='adjustment')
export async function adjustPoints(clientId: string, _formData: FormData) {
  void clientId
  redirect(`/admin/clientes/${clientId}?success=adjusted`)
}
