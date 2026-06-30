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

export async function confirmarCanje(formData: FormData) {
  const supabase = await createClient()
  const digits = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5']
    .map((k) => (formData.get(k) as string | null) ?? '')
  const code = digits.join('').trim()

  const { data, error } = await supabase.functions.invoke('confirm-redemption', {
    body: { code },
  })

  if (error) {
    let errorCode = 'unknown'
    if ('context' in error && error.context instanceof Response) {
      try {
        const body = await (error.context as Response).json()
        errorCode = body?.code ?? 'unknown'
      } catch { /* ignore */ }
    }
    redirect(`/caja/canje?error=${encodeURIComponent(errorCode)}`)
  }

  redirect(
    `/caja/canje?done=1&reward=${encodeURIComponent(data.reward_name)}&pts=${data.points_used}&balance=${data.client_new_balance}`
  )
}
