import type { Metadata } from 'next'
import Link from 'next/link'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { TimeOfferForm } from '@/components/admin/TimeOfferForm'
import { createTimeOffer } from '@/lib/actions/admin-time-offers'

export const metadata: Metadata = { title: 'Nueva oferta — Admin Isidoro' }

export default function NuevaOfertaPage() {
  return (
    <div className="px-8 py-6">
      <Link
        href="/admin/ofertas"
        className="text-xs mb-4 inline-block transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Volver a ofertas
      </Link>
      <h1
        className="text-2xl font-semibold font-display mb-6"
        style={{ color: 'var(--foreground)' }}
      >
        Nueva oferta por horario
      </h1>
      <TimeOfferForm allProducts={MOCK_PRODUCTS} action={createTimeOffer} mode="create" />
    </div>
  )
}
