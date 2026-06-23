import type { Reward } from '@/lib/types'

type Props = {
  rewards: Reward[]
  totalPoints: number
}

export function RewardsList({ rewards, totalPoints }: Props) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--brand-light)',
        border: '1px solid var(--brand)',
      }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-dark)' }}>
        Podés canjear ahora
      </p>
      <ul className="space-y-2">
        {rewards.map((reward) => (
          <li key={reward.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{reward.name}</p>
              {reward.description && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {reward.description}
                </p>
              )}
            </div>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-3"
              style={{
                background: 'var(--brand)',
                color: '#FFFFFF',
              }}
            >
              {reward.points_cost} pts
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Pedile al cajero que inicie el canje con tu QR
      </p>
    </div>
  )
}
