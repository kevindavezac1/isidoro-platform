import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MOCK_TIME_OFFERS, MOCK_TIME_OFFER_PRODUCTS, MOCK_PRODUCTS } from '@/lib/mock-data'
import { TimeOfferForm } from '@/components/admin/TimeOfferForm'
import { updateTimeOffer } from '@/lib/actions/admin-time-offers'

export const metadata: Metadata = { title: 'Editar oferta — Admin Isidoro' }

export default async function EditarOfertaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const offer = MOCK_TIME_OFFERS.find((o) => o.id === id)
  if (!offer) notFound()

  const initialAssociations = MOCK_TIME_OFFER_PRODUCTS.filter(
    (top) => top.time_offer_id === id,
  ).map((top) => ({
    product_id: top.product_id,
    price_override: top.price_override,
  }))

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
        className="text-2xl font-semibold font-display mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        Editar oferta
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        {offer.name}
      </p>
      <TimeOfferForm
        offer={offer}
        allProducts={MOCK_PRODUCTS}
        initialAssociations={initialAssociations}
        action={updateTimeOffer.bind(null, id)}
        mode="edit"
      />
    </div>
  )
}
