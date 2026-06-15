# API_CONTRACTS.md — Contratos de API
> Kevin completa este documento al terminar cada endpoint. Fran lo usa para integrar sin preguntar.
> Última actualización: 15 de junio de 2026 — Kevin (Backend Agent)

---

## Convenciones generales

- Base URL: `https://<PROJECT_REF>.supabase.co` (disponible en `.env.local` como `NEXT_PUBLIC_SUPABASE_URL`)
- Auth: todas las rutas privadas requieren `Authorization: Bearer <supabase_jwt>`
- Respuestas: JSON. Errores siempre con `{ error: string, code?: string }`
- PostgREST: endpoints automáticos de Supabase, filtros via query params
- Edge Functions: lógica de negocio compleja, prefijo `/functions/v1/`

---

## Estado de implementación

| Endpoint | Método | Tipo | Estado |
|---|---|---|---|
| GET /rest/v1/settings | GET | PostgREST | ✅ Listo |
| GET /rest/v1/categories | GET | PostgREST | ✅ Listo |
| POST /rest/v1/categories | POST | PostgREST | ✅ Listo |
| PATCH /rest/v1/categories | PATCH | PostgREST | ✅ Listo |
| GET /rest/v1/products | GET | PostgREST | ✅ Listo |
| POST /rest/v1/products | POST | PostgREST | ✅ Listo |
| PATCH /rest/v1/products | PATCH | PostgREST | ✅ Listo |
| GET /rest/v1/promotions | GET | PostgREST | ✅ Listo |
| POST /rest/v1/promotions | POST | PostgREST | ✅ Listo |
| GET /rest/v1/time_offers | GET | PostgREST | ✅ Listo |
| GET /rest/v1/rewards | GET | PostgREST | ✅ Listo |
| GET /rest/v1/profiles | GET | PostgREST | ✅ Listo |
| GET /rest/v1/points_balance | GET | PostgREST | ✅ Listo |
| GET /rest/v1/points_transactions | GET | PostgREST | ✅ Listo |
| GET /rest/v1/redemptions | GET | PostgREST | ✅ Listo |
| POST /functions/v1/register-consumption | POST | Edge Function | ✅ Listo |
| POST /functions/v1/initiate-redemption | POST | Edge Function | ✅ Listo |
| POST /functions/v1/confirm-redemption | POST | Edge Function | ✅ Listo |
| POST /functions/v1/split-consumption | POST | Edge Function | ⬜ Pendiente (S4) |
| GET /functions/v1/reports | GET | Edge Function | ⬜ Pendiente (S4) |

---

## Auth (Supabase Auth — no requiere implementación manual)

**Registro con email/password**
```
POST /auth/v1/signup
Body: { email, password, options: { data: { full_name: "Nombre Apellido" } } }
Response: { user, session }
```
> ⚠️ `full_name` es obligatorio en `options.data`. El trigger `handle_new_user` lo lee de `raw_user_meta_data`.

**Login con email/password**
```
POST /auth/v1/token?grant_type=password
Body: { email, password }
Response: { access_token, token_type, user }
```

**Login con Google OAuth**
```typescript
// En el cliente Next.js:
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})
```
> Redirect URL configurada: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

---

## Settings

**GET /rest/v1/settings**
- Auth: No requerida (lectura pública)
- Fran: leer `timezone` para calcular ofertas activas por horario (DEC-013)
```typescript
// Request
supabase.from('settings').select('points_per_peso, timezone').single()

// Response
{
  "points_per_peso": 1.0,
  "timezone": "America/Argentina/Buenos_Aires"
}
```

---

## Categorías

**GET /rest/v1/categories**
- Auth: No requerida (lectura pública)
- RLS filtra automáticamente `deleted_at IS NULL`
```typescript
supabase
  .from('categories')
  .select('*')
  .order('sort_order', { ascending: true })

// Response: Category[]
[
  { "id": "uuid", "name": "Entradas", "sort_order": 1, "deleted_at": null, "created_at": "...", "updated_at": "..." }
]
```

**POST /rest/v1/categories**
- Auth: Sí (rol admin)
```typescript
supabase.from('categories').insert({ name: "Postres", sort_order: 4 })
// Body mínimo: { name: string, sort_order?: number }
```

**PATCH /rest/v1/categories?id=eq.{id}**
- Auth: Sí (rol admin)
```typescript
supabase.from('categories').update({ name: "Bebidas" }).eq('id', id)
// Soft delete:
supabase.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id)
```

---

## Productos

**GET /rest/v1/products**
- Auth: No requerida (lectura pública)
- RLS filtra automáticamente `deleted_at IS NULL`
```typescript
// Carta pública completa (con categorías embebidas)
supabase
  .from('products')
  .select('*, categories(name, sort_order)')
  .eq('is_available', true)
  .order('sort_order', { ascending: true })

// Por categoría
supabase
  .from('products')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_available', true)
  .order('sort_order', { ascending: true })

// Response: Product[]
[
  {
    "id": "uuid",
    "category_id": "uuid",
    "name": "Milanesa napolitana",
    "description": "Con jamón, mozzarella y tomate",
    "price": 3500.00,
    "image_url": "https://...",
    "is_available": true,
    "sort_order": 1,
    "deleted_at": null,
    "categories": { "name": "Principales", "sort_order": 2 }
  }
]
```

**POST /rest/v1/products**
- Auth: Sí (rol admin)
```typescript
supabase.from('products').insert({
  category_id: "uuid",
  name: "Café con leche",
  price: 800.00,
  sort_order: 1
})
// Campos opcionales: description, image_url, is_available (default true)
```

**PATCH /rest/v1/products?id=eq.{id}**
- Auth: Sí (rol admin)
```typescript
// Editar
supabase.from('products').update({ price: 900.00, is_available: false }).eq('id', id)
// Soft delete
supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
```

---

## Promociones

**GET /rest/v1/promotions**
- Auth: No requerida (lectura pública)
```typescript
// Promociones vigentes hoy
const now = new Date().toISOString()
supabase
  .from('promotions')
  .select('*')
  .eq('is_active', true)
  .lte('valid_from', now)
  .gte('valid_until', now)
  .order('valid_from', { ascending: false })
```

**POST /rest/v1/promotions**
- Auth: Sí (rol admin)
```typescript
supabase.from('promotions').insert({
  name: "2x1 en pizzas",
  description: "Todos los lunes",
  valid_from: "2026-06-16T00:00:00Z",
  valid_until: "2026-06-30T23:59:59Z"
})
```

---

## Ofertas por horario

**GET /rest/v1/time_offers**
- Auth: No requerida (lectura pública)
- ⚠️ La lógica "activa ahora" se calcula en el cliente usando `settings.timezone` (DEC-013)
```typescript
// Fran: obtener todas las activas + sus productos
supabase
  .from('time_offers')
  .select('*, time_offer_products(product_id)')
  .eq('is_active', true)

// Response
[
  {
    "id": "uuid",
    "name": "Happy Hour",
    "description": "Bebidas al 50%",
    "start_time": "18:00:00",
    "end_time": "20:00:00",
    "is_active": true,
    "time_offer_products": [
      { "product_id": "uuid" }
    ]
  }
]

// Fran: calcular si está activa ahora
function isTimeOfferActive(offer: TimeOffer, timezone: string): boolean {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const localTime = formatter.format(now) // "HH:MM:SS"
  return localTime >= offer.start_time && localTime <= offer.end_time
}
```

---

## Recompensas

**GET /rest/v1/rewards**
- Auth: No requerida (lectura pública)
- RLS filtra automáticamente `is_active = true`
```typescript
supabase
  .from('rewards')
  .select('*')
  .order('points_cost', { ascending: true })

// Response: Reward[]
[
  {
    "id": "uuid",
    "name": "Café gratis",
    "description": "Un café simple o con leche",
    "points_cost": 50,
    "stock": 100,
    "is_active": true
  }
]
```

---

## Perfil del cliente

**GET /rest/v1/profiles**
- Auth: Sí (cualquier rol autenticado)
- RLS: cliente ve solo el suyo; cajero y admin ven todos

```typescript
// Cliente: obtener propio perfil
supabase.from('profiles').select('*').eq('id', userId).single()

// Cajero: buscar cliente por QR token (al escanear el QR)
supabase
  .from('profiles')
  .select('id, full_name, phone, qr_token')
  .eq('qr_token', qrToken)
  .single()

// Response
{
  "id": "uuid",
  "role": "cliente",
  "full_name": "María García",
  "phone": "+54911...",
  "qr_token": "abc123...",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Saldo de puntos

**GET /rest/v1/points_balance**
- Auth: Sí
- RLS: cliente ve solo el suyo; cajero y admin ven todos

```typescript
// Cliente: propio saldo
supabase
  .from('points_balance')
  .select('total_points, updated_at')
  .eq('client_id', userId)
  .single()

// Cajero: saldo de un cliente específico (después de escanear QR)
supabase
  .from('points_balance')
  .select('total_points')
  .eq('client_id', clientId)
  .single()

// Response
{ "total_points": 150, "updated_at": "2026-06-15T20:00:00Z" }
```

---

## Historial de puntos

**GET /rest/v1/points_transactions**
- Auth: Sí
- RLS: cliente ve solo los suyos; cajero y admin ven todos

```typescript
// Historial del cliente autenticado (últimas 20 transacciones)
supabase
  .from('points_transactions')
  .select('id, type, points, expires_at, created_at, consumptions(amount, consumed_at), redemptions(rewards(name))')
  .eq('client_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

// Response: PointsTransaction[]
[
  {
    "id": "uuid",
    "type": "consumption",
    "points": 35,
    "expires_at": "2027-06-15T20:00:00Z",
    "created_at": "2026-06-15T20:00:00Z",
    "consumptions": { "amount": 3500.00, "consumed_at": "2026-06-15T20:00:00Z" }
  },
  {
    "id": "uuid",
    "type": "redemption",
    "points": -50,
    "expires_at": "2027-06-15T20:00:00Z",
    "created_at": "2026-06-15T21:00:00Z",
    "redemptions": { "rewards": { "name": "Café gratis" } }
  }
]
```

---

## Canjes

**GET /rest/v1/redemptions**
- Auth: Sí
- RLS: cliente ve los suyos; cajero y admin ven todos

```typescript
// Cliente: canjes pendientes activos
supabase
  .from('redemptions')
  .select('id, code, status, expires_at, rewards(name, points_cost)')
  .eq('client_id', userId)
  .eq('status', 'pending')
  .gt('expires_at', new Date().toISOString())

// Historial completo
supabase
  .from('redemptions')
  .select('*, rewards(name)')
  .eq('client_id', userId)
  .order('created_at', { ascending: false })
```

---

## Edge Functions

### POST /functions/v1/register-consumption

El cajero registra un consumo. Calcula y acredita puntos automáticamente (atómico).

- **Auth:** Sí — rol `cajero` o `admin`
- **Implementación:** `supabase/functions/register-consumption/index.ts`

```typescript
// Request
const { data, error } = await supabase.functions.invoke('register-consumption', {
  body: {
    client_id:  "uuid",       // obligatorio: UUID del cliente
    amount:     1500.00,      // obligatorio: monto en pesos ARS (> 0)
    notes:      "Mesa 5",     // opcional
    session_id: "uuid",       // opcional: para división de cuenta (DEC-007)
  }
})

// Response 200
{
  "consumption_id": "uuid",
  "points_earned":  15,
  "new_balance":    42
}

// Errores posibles
// 401 { "error": "Unauthorized" }
// 403 { "error": "Forbidden", "code": "insufficient_role" }
// 400 { "error": "Bad request", "code": "missing_client_id" | "invalid_amount" }
// 404 { "error": "client_not_found", "code": "client_not_found" }
// 500 { "error": "Internal server error" }
```

---

### POST /functions/v1/initiate-redemption

El cliente inicia un canje. Valida saldo, genera código numérico de 6 dígitos.

- **Auth:** Sí — rol `cliente`
- **Implementación:** `supabase/functions/initiate-redemption/index.ts`

```typescript
// Request
const { data, error } = await supabase.functions.invoke('initiate-redemption', {
  body: {
    reward_id: "uuid"  // obligatorio
  }
})

// Response 200
{
  "redemption_id": "uuid",
  "code":          "384921",   // char(6) numérico
  "expires_at":    "2026-06-15T21:15:00Z"  // now() + 15 minutos
}

// Errores posibles
// 401 { "error": "Unauthorized" }
// 403 { "error": "Forbidden", "code": "insufficient_role" }
// 400 { "error": "Bad request", "code": "missing_reward_id" }
// 400 { "error": "Reward is not active", "code": "reward_inactive" }
// 400 { "error": "Reward out of stock", "code": "out_of_stock" }
// 400 { "error": "Insufficient points", "code": "insufficient_points", "available": N, "required": M }
// 404 { "error": "Reward not found", "code": "reward_not_found" }
```

---

### POST /functions/v1/confirm-redemption

El cajero confirma el canje ingresando el código. Descuenta puntos FIFO y reduce stock. **Operación atómica garantizada.**

- **Auth:** Sí — rol `cajero` o `admin`
- **Implementación:** `supabase/functions/confirm-redemption/index.ts`
- ⚠️ Todo o nada: si falla cualquier paso, se revierte todo.

```typescript
// Request
const { data, error } = await supabase.functions.invoke('confirm-redemption', {
  body: {
    code: "384921"  // obligatorio: 6 dígitos numéricos
  }
})

// Response 200
{
  "redemption_id":      "uuid",
  "client_id":          "uuid",
  "reward_name":        "Café gratis",
  "points_used":        50,
  "client_new_balance": 17
}

// Errores posibles
// 401 { "error": "Unauthorized" }
// 403 { "error": "Forbidden", "code": "insufficient_role" }
// 400 { "error": "Bad request", "code": "invalid_code_format" }
// 404 { "error": "invalid_code", "code": "invalid_code" }
// 400 { "error": "code_expired", "code": "code_expired" }
// 400 { "error": "insufficient_points", "code": "insufficient_points" }
// 400 { "error": "out_of_stock", "code": "out_of_stock" }
```

---

## Tipos TypeScript para Fran

```typescript
// src/lib/types/index.ts — tipos de dominio (ya generados en database.types.ts)
// Usar directamente los tipos de Database['public']['Tables'][tabla]['Row']

import type { Database } from './database.types'

export type Profile           = Database['public']['Tables']['profiles']['Row']
export type Category          = Database['public']['Tables']['categories']['Row']
export type Product           = Database['public']['Tables']['products']['Row']
export type Promotion         = Database['public']['Tables']['promotions']['Row']
export type TimeOffer         = Database['public']['Tables']['time_offers']['Row']
export type TimeOfferProduct  = Database['public']['Tables']['time_offer_products']['Row']
export type Reward            = Database['public']['Tables']['rewards']['Row']
export type Consumption       = Database['public']['Tables']['consumptions']['Row']
export type PointsBalance     = Database['public']['Tables']['points_balance']['Row']
export type PointsTransaction = Database['public']['Tables']['points_transactions']['Row']
export type Redemption        = Database['public']['Tables']['redemptions']['Row']
export type Settings          = Database['public']['Tables']['settings']['Row']

// Tipos de response de Edge Functions
export type RegisterConsumptionResponse = {
  consumption_id: string
  points_earned:  number
  new_balance:    number
}

export type InitiateRedemptionResponse = {
  redemption_id: string
  code:          string
  expires_at:    string
}

export type ConfirmRedemptionResponse = {
  redemption_id:      string
  client_id:          string
  reward_name:        string
  points_used:        number
  client_new_balance: number
}
```
