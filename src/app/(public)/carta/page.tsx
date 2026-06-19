import type { Metadata } from 'next'
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_PROMOTIONS, MOCK_TIME_OFFERS } from '@/lib/mock-data'
import { slugify } from '@/lib/utils'
import { CategoryTabs } from '@/components/carta/CategoryTabs'
import { ProductCard } from '@/components/carta/ProductCard'
import { PromoBanner } from '@/components/carta/PromoBanner'
import type { Promotion, TimeOffer } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carta — Isidoro',
  description: 'Menú digital del Restaurante Isidoro',
}

const RESTAURANT_TZ = 'America/Argentina/Buenos_Aires'

function isPromotionActive(promo: Promotion): boolean {
  const now = new Date()
  return (
    promo.is_active &&
    new Date(promo.valid_from) <= now &&
    now <= new Date(promo.valid_until)
  )
}

function isTimeOfferActive(offer: TimeOffer): boolean {
  if (!offer.is_active) return false
  const nowInTZ = new Date().toLocaleTimeString('en-GB', {
    timeZone: RESTAURANT_TZ,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return nowInTZ >= offer.start_time && nowInTZ <= offer.end_time
}

export default function CartaPage() {
  const categories = MOCK_CATEGORIES.filter((c) => !c.deleted_at).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const products = MOCK_PRODUCTS.filter((p) => !p.deleted_at)
  const activePromos = MOCK_PROMOTIONS.filter(isPromotionActive)
  const activeTimeOffers = MOCK_TIME_OFFERS.filter(isTimeOfferActive)
  const hasBanners = activePromos.length > 0 || activeTimeOffers.length > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 py-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Isidoro</h1>
        <p className="mt-0.5 text-sm text-text-muted">Carta digital</p>
      </header>

      {hasBanners && (
        <div className="border-b border-border bg-brand-light divide-y divide-border">
          {activeTimeOffers.map((offer) => (
            <PromoBanner
              key={offer.id}
              title={offer.name}
              description={offer.description}
              type="time"
            />
          ))}
          {activePromos.map((promo) => (
            <PromoBanner
              key={promo.id}
              title={promo.name}
              description={promo.description}
              type="promo"
            />
          ))}
        </div>
      )}

      <CategoryTabs categories={categories} />

      <main className="pb-10">
        {categories.map((category) => {
          const categoryProducts = products
            .filter((p) => p.category_id === category.id)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (categoryProducts.length === 0) return null

          return (
            <section
              key={category.id}
              id={`section-${slugify(category.name)}`}
              className="scroll-mt-14"
            >
              <h2 className="px-4 pb-3 pt-6 text-lg font-semibold text-foreground">
                {category.name}
              </h2>
              <div className="flex flex-col gap-3 px-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
