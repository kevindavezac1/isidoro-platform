import type { Metadata } from 'next'
import Link from 'next/link'
import { MOCK_CATEGORIES } from '@/lib/mock-data'
import { ProductForm } from '@/components/admin/ProductForm'
import { createProduct } from '@/lib/actions/admin-products'

export const metadata: Metadata = { title: 'Nuevo producto — Admin Isidoro' }

export default function NuevoProductoPage() {
  const categories = MOCK_CATEGORIES
    .filter((c) => !c.deleted_at)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="text-xs mb-3 inline-block transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver a productos
        </Link>
        <h1 className="text-2xl font-semibold font-display" style={{ color: 'var(--foreground)' }}>
          Nuevo producto
        </h1>
      </div>
      <ProductForm categories={categories} action={createProduct} mode="create" />
    </div>
  )
}
