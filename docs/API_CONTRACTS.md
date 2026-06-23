# API_CONTRACTS.md — Contratos de API
> Kevin completa este documento al terminar cada endpoint. Fran lo usa para integrar sin preguntar.
> Última actualización: 14 de junio de 2026 — Estado: VACÍO (Kevin aún no implementó ningún endpoint)

---

## Convenciones generales

- Base URL: `https://<proyecto>.supabase.co` (Kevin definirá la URL real)
- Auth: todas las rutas privadas requieren `Authorization: Bearer <supabase_jwt>`
- Respuestas: JSON. Errores siempre con `{ error: string, code?: string }`
- Los endpoints de Supabase son generados automáticamente por la API de PostgREST, excepto los que requieren lógica de negocio (esos van como Edge Functions)
- Kevin indica en cada endpoint si es PostgREST o Edge Function

---

## Estado de implementación

| Endpoint | Método | Semana | Estado |
|---|---|---|---|
| GET /rest/v1/products | GET | S2 | ⬜ Pendiente |
| GET /rest/v1/categories | GET | S2 | ⬜ Pendiente |
| POST /rest/v1/products | POST | S2 | ⬜ Pendiente |
| PUT /rest/v1/products/{id} | PATCH | S2 | ⬜ Pendiente |
| DELETE /rest/v1/products/{id} | DELETE | S2 | ⬜ Pendiente |
| GET /rest/v1/time_offers | GET | S2 | ⬜ Pendiente |
| GET /rest/v1/time_offer_products | GET | S2 | ✅ Schema listo (migración 20260623000000) |
| POST /functions/v1/register-consumption | POST | S3 | ⬜ Pendiente |
| POST /functions/v1/initiate-redemption | POST | S3 | ⬜ Pendiente |
| POST /functions/v1/confirm-redemption | POST | S3 | ⬜ Pendiente |
| GET /rest/v1/points_transactions | GET | S3 | ⬜ Pendiente |
| POST /functions/v1/split-consumption | POST | S4 | ⬜ Pendiente |
| GET /functions/v1/reports | GET | S4 | ⬜ Pendiente |

---

## Detalle de contratos

> Kevin: completar cada sección a medida que implementa. Incluir ejemplos de request y response reales.

---

### Auth (Supabase Auth — no requiere implementación manual)

**Registro con email/password**
```
POST /auth/v1/signup
Body: { email, password }
Response: { user, session }
```

**Login con email/password**
```
POST /auth/v1/token?grant_type=password
Body: { email, password }
Response: { access_token, token_type, user }
```

**Login con Google OAuth**
```
Iniciado desde el cliente con supabase.auth.signInWithOAuth({ provider: 'google' })
Kevin: confirmar redirect URL configurada en Supabase Dashboard
```

---

### Productos

**GET /rest/v1/products**
- Descripción: Lista todos los productos disponibles para la carta pública
- Auth requerida: No (lectura pública)
- Filtros disponibles: `is_available=eq.true`, `category_id=eq.{id}`, `order=sort_order.asc`
- Estado: ⬜ Pendiente
- Ejemplo de response:
```json
// Kevin completa cuando implementa
```

**POST /rest/v1/products**
- Descripción: Crear nuevo producto
- Auth requerida: Sí (rol admin)
- Estado: ⬜ Pendiente
- Body:
```json
// Kevin completa cuando implementa
```

**PATCH /rest/v1/products?id=eq.{id}**
- Descripción: Editar producto existente
- Auth requerida: Sí (rol admin)
- Estado: ⬜ Pendiente

**PATCH /rest/v1/products?id=eq.{id}**
- Descripción: Soft delete (deleted_at = now())
- Auth requerida: Sí (rol admin)
- Estado: ⬜ Pendiente

---

### Categorías

**GET /rest/v1/categories**
- Auth requerida: No (lectura pública)
- Filtros: `order=sort_order.asc`
- Estado: ⬜ Pendiente

---

### Ofertas por horario

**GET /rest/v1/time_offers**
- Descripción: Lista todas las ofertas (la lógica de "activa ahora" se resuelve en el cliente comparando con la hora local del restaurante)
- ⚠️ Kevin: confirmar si la activación se resuelve en cliente o en una Edge Function que devuelve solo las activas
- Estado: ⬜ Pendiente

**GET /rest/v1/time_offer_products**
- Descripción: Productos asociados a cada oferta por horario. Incluye `price_override` para sobreescribir el precio del producto durante la oferta.
- Auth requerida: No (lectura pública)
- Filtros disponibles: `time_offer_id=eq.{id}`, `select=*,products(*)` para join con productos
- Estado: ✅ Schema listo (migración `20260623000000`)
- Ejemplo de response:
```json
[
  {
    "id": "uuid",
    "time_offer_id": "uuid",
    "product_id": "uuid",
    "price_override": 1750.00
  }
]
```
- Notas:
  - `price_override = null` → mostrar `products.price` sin modificación
  - `price_override != null` → mostrar precio tachado (`products.price`) + precio destacado (`price_override`)
  - El frontend calcula los puntos acumulables sobre el `price_override` cuando existe (DEC-020)

---

### Sistema de puntos (Edge Functions)

**POST /functions/v1/register-consumption**
- Descripción: El cajero registra un consumo. Calcula y acredita los puntos automáticamente.
- Auth requerida: Sí (rol cajero o admin)
- Estado: ⬜ Pendiente
- Body esperado:
```json
{
  "client_id": "uuid",
  "amount": 1500.00,
  "notes": "Mesa 5"
}
```
- Response esperado:
```json
{
  "consumption_id": "uuid",
  "points_earned": 15,
  "new_balance": 42
}
```

---

**POST /functions/v1/initiate-redemption**
- Descripción: El cliente inicia un canje. Genera y devuelve el código de 6 dígitos.
- Auth requerida: Sí (rol cliente)
- Estado: ⬜ Pendiente
- Body esperado:
```json
{
  "reward_id": "uuid"
}
```
- Response esperado:
```json
{
  "redemption_id": "uuid",
  "code": "384921",
  "expires_at": "2026-06-14T22:00:00Z"
}
```

---

**POST /functions/v1/confirm-redemption**
- Descripción: El cajero confirma el canje ingresando el código. Descuenta puntos (FIFO) y reduce stock si aplica.
- Auth requerida: Sí (rol cajero o admin)
- ⚠️ Esta operación DEBE ser atómica. Si falla cualquier paso, revertir todo.
- Estado: ⬜ Pendiente
- Body esperado:
```json
{
  "code": "384921"
}
```
- Response esperado:
```json
{
  "redemption_id": "uuid",
  "client_id": "uuid",
  "reward_name": "Café gratis",
  "points_used": 50,
  "client_new_balance": 17
}
```

---

**POST /functions/v1/split-consumption**
- Descripción: El cajero divide una cuenta entre múltiples clientes. Acredita puntos proporcionales a cada uno.
- Auth requerida: Sí (rol cajero o admin)
- Estado: ⬜ Pendiente (Semana 4)
- Body esperado:
```json
{
  "total_amount": 3000.00,
  "splits": [
    { "client_id": "uuid-1", "amount": 1200.00 },
    { "client_id": "uuid-2", "amount": 1800.00 }
  ]
}
```

---

**GET /functions/v1/reports**
- Descripción: Reportes para el panel admin
- Auth requerida: Sí (rol admin)
- Estado: ⬜ Pendiente (Semana 4)
- Parámetros: `from`, `to` (fechas), `type` (consumptions / points / rewards)

---

## Notas para Fran

Hasta que Kevin complete un endpoint, usar datos mock con esta estructura TypeScript:

```typescript
// Fran: crear /types/api.ts con estas interfaces y reemplazar por llamadas reales cuando Kevin actualice este documento

type Product = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
}

type Category = {
  id: string
  name: string
  sort_order: number
}

type PointsBalance = {
  client_id: string
  total_points: number
}

type Redemption = {
  id: string
  code: string
  expires_at: string
  status: 'pending' | 'confirmed' | 'expired'
}
```
