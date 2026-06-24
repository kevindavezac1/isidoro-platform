import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  MOCK_POINTS_BALANCE,
  MOCK_POINTS_TRANSACTIONS,
  MOCK_REWARDS,
} from '@/lib/mock-data'
import { PointsCard } from '@/components/perfil/PointsCard'
import { QRDisplay } from '@/components/perfil/QRDisplay'
import { RewardsList } from '@/components/perfil/RewardsList'
import { TransactionHistory } from '@/components/perfil/TransactionHistory'
import QRCode from 'qrcode'

export const metadata: Metadata = {
  title: 'Mi perfil — Isidoro',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, qr_token')
    .eq('id', user!.id)
    .single()

  // TODO: replace with real Supabase query when Kevin publishes endpoints
  const balance = MOCK_POINTS_BALANCE
  const transactions = MOCK_POINTS_TRANSACTIONS
  const rewards = MOCK_REWARDS

  const qrSvg = profile?.qr_token
    ? await QRCode.toString(profile.qr_token, {
        type: 'svg',
        margin: 1,
        color: { dark: '#1C1917', light: '#FFFFFF' },
      })
    : null

  const affordableRewards = rewards.filter(
    (r) => r.is_active && balance.total_points >= r.points_cost,
  )

  return (
    <div className="px-4 pb-10 space-y-6 pt-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Bienvenido de vuelta
        </p>
        <h1 className="text-2xl font-semibold tracking-tight font-display">
          {profile?.full_name ?? 'Cliente'}
        </h1>
      </div>

      <PointsCard points={balance.total_points} />

      {affordableRewards.length > 0 && (
        <RewardsList rewards={affordableRewards} totalPoints={balance.total_points} />
      )}

      <QRDisplay qrSvg={qrSvg} />

      <TransactionHistory transactions={transactions} />
    </div>
  )
}
