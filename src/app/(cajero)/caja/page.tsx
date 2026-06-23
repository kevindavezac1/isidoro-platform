import type { Metadata } from 'next'
import { MOCK_CLIENTS, MOCK_SETTINGS } from '@/lib/mock-data'
import { RegistrarConsumoForm } from '@/components/cajero/RegistrarConsumoForm'
import { registrarConsumo } from '@/lib/actions/cajero'

export const metadata: Metadata = { title: 'Caja — Isidoro' }

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; done?: string; pts?: string }>
}) {
  const { q, done, pts } = await searchParams
  const query = q?.trim() ?? ''

  // Client lookup by QR token (exact) or name/email (contains)
  const foundClient = query
    ? MOCK_CLIENTS.find(
        (c) =>
          c.qr_token === query ||
          c.full_name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()),
      )
    : null

  // Client for success banner
  const doneClient = done ? MOCK_CLIENTS.find((c) => c.id === done) : null
  const ptsEarned = pts ? parseInt(pts, 10) : 0

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {doneClient && (
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ background: 'rgba(202,158,105,0.12)', border: '1px solid rgba(202,158,105,0.35)' }}
        >
          <p className="text-2xl mb-1">✓</p>
          <p className="font-semibold text-sm" style={{ color: 'var(--brand)' }}>
            Consumo registrado
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>
            <span className="font-medium">{doneClient.full_name}</span> recibió{' '}
            <span className="font-bold" style={{ color: 'var(--brand)' }}>
              +{ptsEarned} pts
            </span>
          </p>
        </div>
      )}

      {/* Search */}
      <div>
        <h1 className="text-xl font-semibold font-display mb-4" style={{ color: 'var(--foreground)' }}>
          Buscar cliente
        </h1>
        <form method="GET" action="/caja" className="flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Escanear QR o escribir nombre / email"
            autoComplete="off"
            autoFocus={!foundClient}
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Not found */}
      {query && !foundClient && (
        <div
          className="rounded-2xl px-5 py-6 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="font-medium text-sm mb-1" style={{ color: 'var(--foreground)' }}>
            Cliente no encontrado
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Verificá el QR o el nombre ingresado
          </p>
        </div>
      )}

      {/* Client card + form */}
      {foundClient && (
        <div className="space-y-4">
          {/* Client card */}
          <div
            className="rounded-2xl px-5 py-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {foundClient.full_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {foundClient.email}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-xl font-bold tabular-nums"
                  style={{ color: 'var(--brand)' }}
                >
                  {foundClient.balance?.total_points ?? 0}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  puntos actuales
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          {/* Consumption form */}
          <RegistrarConsumoForm
            clientId={foundClient.id}
            clientName={foundClient.full_name}
            pointsPerPeso={MOCK_SETTINGS.points_per_peso}
            action={registrarConsumo.bind(null, foundClient.id)}
          />
        </div>
      )}

      {/* Empty state */}
      {!query && !doneClient && (
        <div
          className="rounded-2xl px-5 py-10 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-3 mx-auto" style={{ width: 48, height: 48, opacity: 0.3 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2h-2zM16 16h2" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Escaneá el QR del cliente o buscá por nombre
          </p>
        </div>
      )}
    </div>
  )
}
