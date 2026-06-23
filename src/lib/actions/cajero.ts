'use server'

import { redirect } from 'next/navigation'
import { MOCK_SETTINGS } from '@/lib/mock-data'

// TODO: replace with Supabase insert into consumptions + points_transactions (via DB trigger)
export async function registrarConsumo(clientId: string, formData: FormData) {
  const amount = parseInt(formData.get('amount') as string, 10)
  const pts = Math.floor((isNaN(amount) ? 0 : amount) * MOCK_SETTINGS.points_per_peso)
  redirect(`/caja?done=${clientId}&pts=${pts}`)
}
