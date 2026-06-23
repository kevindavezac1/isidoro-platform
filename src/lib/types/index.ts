import type { Database } from './database.types'

// Aliases de Row
export type Profile           = Database['public']['Tables']['profiles']['Row']
export type Category          = Database['public']['Tables']['categories']['Row']
export type Product           = Database['public']['Tables']['products']['Row']
export type Promotion         = Database['public']['Tables']['promotions']['Row']
export type TimeOffer         = Database['public']['Tables']['time_offers']['Row']
export type TimeOfferProduct  = Database['public']['Tables']['time_offer_products']['Row']
export type Reward            = Database['public']['Tables']['rewards']['Row']
export type Consumption       = Database['public']['Tables']['consumptions']['Row']
export type PointsBalance     = Database['public']['Tables']['points_balance']['Row']
export type Redemption        = Database['public']['Tables']['redemptions']['Row']
export type PointsTransaction = Database['public']['Tables']['points_transactions']['Row']
export type Settings          = Database['public']['Tables']['settings']['Row']

// Aliases de Insert
export type InsertConsumption = Database['public']['Tables']['consumptions']['Insert']
export type InsertRedemption  = Database['public']['Tables']['redemptions']['Insert']

// Tipos compuestos para UI
export type ProductWithCategory = Product & {
  category: Pick<Category, 'id' | 'name'>
}

export type TimeOfferWithProducts = TimeOffer & {
  products: Product[]
}

export type RedemptionWithReward = Redemption & {
  reward: Pick<Reward, 'id' | 'name' | 'points_cost'>
}

export type ConsumptionWithClient = Consumption & {
  client: Pick<Profile, 'id' | 'full_name' | 'qr_token'>
}

// Roles
export type UserRole = Profile['role']

// UI-only: price_override needs to be added to time_offer_products by Kevin — see DEC-019
export type TimeOfferProductWithPrice = TimeOfferProduct & {
  price_override: number | null
}

export type ProductWithDiscount = Product & {
  discount_price: number | null
}

export type PromoSlide = {
  id: string
  badge: 'AHORA' | 'PROMO'
  title: string
  description: string | null
  price: number | null
  originalPrice: number | null
}
