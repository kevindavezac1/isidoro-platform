import type { Metadata } from 'next'
import Link from 'next/link'
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data'
import { SuccessBanner } from '@/components/admin/SuccessBanner'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { deleteCategory } from '@/lib/actions/admin-categories'

export const metadata: Metadata = { title: 'Categorías — Admin Isidoro' }

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams

  const categories = MOCK_CATEGORIES
    .filter((c) => !c.deleted_at)
    .sort((a, b) => a.sort_order - b.sort_order)

  const productCountMap = Object.fromEntries(
    categories.map((c) => [
      c.id,
      MOCK_PRODUCTS.filter((p) => p.category_id === c.id && !p.deleted_at).length,
    ]),
  )

  return (
    <div>
      <SuccessBanner type={success} />

      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold font-display" style={{ color: 'var(--foreground)' }}>
              Categorías
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {categories.length} categoría{categories.length !== 1 ? 's' : ''} en carta
            </p>
          </div>
          <Link
            href="/admin/categorias/nueva"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--brand)', color: 'var(--background)' }}
          >
            + Nueva categoría
          </Link>
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--border)' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Nombre
                </th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Orden
                </th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Productos
                </th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  style={{
                    background: i % 2 === 0 ? 'var(--background)' : 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {cat.sort_order}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {productCountMap[cat.id]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/categorias/${cat.id}/editar`}
                        className="text-xs transition-opacity hover:opacity-70"
                        style={{ color: 'var(--brand)' }}
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        action={deleteCategory.bind(null, cat.id)}
                        label="Eliminar"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="px-8 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              No hay categorías.{' '}
              <Link href="/admin/categorias/nueva" style={{ color: 'var(--brand)' }}>
                Crear la primera
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
