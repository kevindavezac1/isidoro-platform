import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MOCK_CLIENTS, MOCK_CLIENT_CONSUMPTIONS } from '@/lib/mock-data'
import { PointsAdjustForm } from '@/components/admin/PointsAdjustForm'
import { adjustPoints } from '@/lib/actions/admin-clients'
import { SuccessBanner } from '@/components/admin/SuccessBanner'
import { formatARS } from '@/lib/utils'

export const metadata: Metadata = { title: 'Detalle cliente — Admin Isidoro' }

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { id } = await params
  const { success } = await searchParams

  const client = MOCK_CLIENTS.find((c) => c.id === id)
  if (!client) notFound()

  const consumptions = MOCK_CLIENT_CONSUMPTIONS.filter(
    (c) => c.client_id === id,
  ).sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())

  const totalSpent = consumptions.reduce((acc, c) => acc + c.amount, 0)

  return (
    <div>
      {success === 'adjusted' && (
        <SuccessBanner type="updated" />
      )}
      <div className="px-8 py-6 space-y-8">
        {/* Back */}
        <Link
          href="/admin/clientes"
          className="text-xs inline-block transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver a clientes
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-semibold font-display"
              style={{ color: 'var(--foreground)' }}
            >
              {client.full_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {client.email}
              {client.phone && ` · ${client.phone}`}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div
              className="rounded-xl px-5 py-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--brand)' }}
              >
                {client.balance?.total_points ?? 0}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                puntos
              </p>
            </div>
            <div
              className="rounded-xl px-5 py-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {consumptions.length}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                visitas
              </p>
            </div>
            <div
              className="rounded-xl px-5 py-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-lg font-bold tabular-nums"
                style={{ color: 'var(--foreground)' }}
              >
                {formatARS(totalSpent)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                gastado total
              </p>
            </div>
          </div>
        </div>

        {/* Historial de consumos */}
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            Historial de consumos
          </h2>

          {consumptions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Sin consumos registrados.
            </p>
          ) : (
            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--border)' }}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    style={{
                      background: 'var(--surface)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {['Fecha', 'Monto', 'Puntos ganados', 'Notas'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-medium text-left"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consumptions.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{
                        background: i % 2 === 0 ? 'var(--background)' : 'var(--surface)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <td
                        className="px-4 py-3 tabular-nums text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {formatDateTime(c.consumed_at)}
                      </td>
                      <td
                        className="px-4 py-3 font-medium tabular-nums"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {formatARS(c.amount)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span style={{ color: 'var(--brand)' }}>+{c.points_earned} pts</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {c.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Ajuste manual de puntos */}
        <section>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Ajuste manual de puntos
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Usar para correcciones de caja, cortesías o reversiones. Queda registrado con nota.
          </p>
          <PointsAdjustForm action={adjustPoints.bind(null, id)} />
        </section>
      </div>
    </div>
  )
}
