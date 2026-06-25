'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function adjustPoints(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const points = parseInt(formData.get('points') as string, 10)
  const notes = formData.get('note') as string

  const { error } = await supabase.functions.invoke('adjust-points', {
    body: { client_id: clientId, points, notes },
  })

  if (error) throw new Error(error.message)

  redirect(`/admin/clientes/${clientId}?success=adjusted`)
}
