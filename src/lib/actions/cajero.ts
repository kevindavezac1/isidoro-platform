'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function registrarConsumo(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const amount = parseFloat(formData.get('amount') as string)
  const notes = (formData.get('notes') as string) || undefined

  const { data, error } = await supabase.functions.invoke('register-consumption', {
    body: { client_id: clientId, amount, notes },
  })

  if (error) throw new Error(error.message)

  redirect(`/caja?done=${clientId}&pts=${data.points_earned}`)
}
