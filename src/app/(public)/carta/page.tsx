import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IsidoroLogo } from '@/components/IsidoroLogo'
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_PROMOTIONS,
  MOCK_TIME_OFFERS,
  MOCK_SETTINGS,
  MOCK_TIME_OFFER_PRODUCTS,
} from '@/lib/mock-data'
import { slugify } from '@/lib/utils'
import { CategoryMenu } from '@/components/carta/CategoryMenu'
import { ProductCard } from '@/components/carta/ProductCard'
import { PromoCarousel } from '@/components/carta/PromoCarousel'
import type { Promotion, TimeOffer, ProductWithDiscount, PromoSlide } from '@/lib/types'

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

export default async function CartaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const categories = MOCK_CATEGORIES.filter((c) => !c.deleted_at).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
  const products = MOCK_PRODUCTS.filter((p) => !p.deleted_at)
  const activePromos = MOCK_PROMOTIONS.filter(isPromotionActive)
  const activeTimeOffers = MOCK_TIME_OFFERS.filter(isTimeOfferActive)

  const pointsPerPeso = MOCK_SETTINGS.points_per_peso

  // Build discount map from active time offers
  const activeTimeOfferIds = new Set(activeTimeOffers.map((o) => o.id))
  const discountMap = new Map<string, number>()
  for (const top of MOCK_TIME_OFFER_PRODUCTS) {
    if (activeTimeOfferIds.has(top.time_offer_id) && top.price_override != null) {
      discountMap.set(top.product_id, top.price_override)
    }
  }
  const productsWithDiscount: ProductWithDiscount[] = products.map((p) => ({
    ...p,
    discount_price: discountMap.get(p.id) ?? null,
  }))

  // Build carousel slides
  const slides: PromoSlide[] = [
    ...activeTimeOffers.map((offer): PromoSlide => {
      const top = MOCK_TIME_OFFER_PRODUCTS.find((t) => t.time_offer_id === offer.id)
      const product = top ? products.find((p) => p.id === top.product_id) : null
      return {
        id: offer.id,
        badge: 'AHORA',
        title: offer.name,
        description: offer.description,
        price: top?.price_override ?? product?.price ?? null,
        originalPrice: product && top?.price_override != null ? product.price : null,
      }
    }),
    ...activePromos.map((promo): PromoSlide => ({
      id: promo.id,
      badge: 'PROMO',
      title: promo.name,
      description: promo.description,
      price: null,
      originalPrice: null,
    })),
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <CategoryMenu categories={categories} />

          <div className="flex items-center justify-center">
            <IsidoroLogo height={48} />
          </div>

          <Link
            href={user ? '/perfil' : '/login'}
            className="p-2 rounded-md transition-opacity hover:opacity-60"
            style={{ color: 'var(--foreground)' }}
            aria-label={user ? 'Ir a mi perfil' : 'Iniciar sesión'}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Promo carousel */}
      {slides.length > 0 && <PromoCarousel slides={slides} />}

      {/* Products */}
      <main className="pb-10">
        {categories.map((category) => {
          const categoryProducts = productsWithDiscount
            .filter((p) => p.category_id === category.id)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (categoryProducts.length === 0) return null

          return (
            <section
              key={category.id}
              id={`section-${slugify(category.name)}`}
              className="scroll-mt-16"
            >
              <h2
                className="px-4 pb-4 pt-10 text-2xl font-semibold font-display"
                style={{ color: 'var(--foreground)' }}
              >
                {category.name}
              </h2>
              <div className="flex flex-col gap-4 px-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    pointsPerPeso={pointsPerPeso}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
