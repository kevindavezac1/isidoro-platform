# PROJECT_STATUS.md — Plataforma Isidoro
> Actualizar al iniciar y cerrar cada jornada. El CTO Agent lee este archivo antes de responder cualquier pregunta.

**Última actualización:** 16 de julio de 2026 — Fran (Dashboard de estadísticas integrado con Edge Fn reports real)
**Estado general:** EN CURSO — Semana 4 (backend completo, frontend avanzado)
**Semana actual:** 4 de 4
**Riesgo de plazo:** Bajo

---

## Estado por módulo

### Semana 1 — Fundamentos (bloqueantes)

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Setup Supabase + proyecto | Kevin | ✅ Completado | Proyecto creado, org devsolutions2, región São Paulo |
| Esquema de base de datos | Kevin | ✅ Completado | 12 tablas + RLS en todas + índices + trigger handle_new_user |
| Auth: email/password | Kevin | ✅ Completado | Supabase Auth activo + trigger crea perfil automáticamente |
| Auth: Google OAuth | Kevin | ✅ Completado | Credenciales configuradas en Google Cloud Console y Supabase Dashboard |
| RLS base (roles: cliente, cajero, admin) | Kevin | ✅ Completado | Policies activas en todas las tablas |
| Setup Next.js + estructura de carpetas | Kevin + Fran | ✅ Completado | Next.js 16 + Supabase clients + tipos TypeScript del schema |
| Design system (colores, tipografía, Tailwind) | Fran | ✅ Completado | Paleta de marca (#1f352a/#ca9e69), Playfair Display + Montserrat, logo SVG cuatrifolio |
| Layout base (nav, estructura de páginas) | Fran | ✅ Completado | Route groups (public/cliente/cajero/admin), redirect / → /carta |
| Carta pública con datos mock + QR estático | Fran | ✅ Completado | Mobile-first, menú hamburguesa, carrusel promos, ícono usuario, puntos por producto, precio con descuento |

### Auth (adelantado de S2, desbloqueado por Kevin en S1)

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Login email/password + Google OAuth | Fran | ✅ Completado | Redirect por rol. Ruta `/auth/callback` para OAuth. Validado con usuario real (Francisco Bonfanti) |
| Registro email/password + Google OAuth | Fran | ✅ Completado | `full_name` en `options.data`. Maneja email confirm + auto-login. |

### Semana 2 — Carta digital + gestión de productos

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| API productos (CRUD) | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API categorías (CRUD) | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API promociones con fechas | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API ofertas por horario | Kevin | ✅ Completado | PostgREST + activación en cliente (DEC-013) |
| Carta pública con datos reales + categorías | Fran | ✅ Completado | Integrada con Supabase real: products, categories, promotions, time_offers, settings. Zero errores. Verificado 1 jul 2026. |
| Panel admin: gestión de productos | Fran | ✅ Completado | CRUD completo con mock. Server Actions listas para reemplazar con Supabase. |
| Panel admin: gestión de categorías | Fran | ✅ Completado | CRUD completo con mock. Muestra conteo de productos por categoría. |
| Panel admin: promociones y ofertas por horario | Fran | ✅ Completado | CRUD completo con mock. PromoForm con datetime-local, TimeOfferForm con product associations + price_override. |
| QR dinámico funcional | Fran | ✅ Completado | SVG server-side desde `profiles.qr_token` real |

### Semana 3 — Sistema de puntos + caja

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Lógica de acreditación de puntos | Kevin | ✅ Completado | register_consumption SQL fn — atómico |
| Vencimiento de puntos (FIFO, 12 meses) | Kevin | ✅ Completado | FIFO en confirm_redemption + expires_at en créditos |
| Recompensas con stock opcional | Kevin | ✅ Completado | PostgREST + stock decrementado en confirm_redemption |
| Generación de código de canje (6 dígitos) | Kevin | ✅ Completado | Edge Fn initiate-redemption — crypto.getRandomValues |
| Confirmación de canje por cajero | Kevin | ✅ Completado | Edge Fn confirm-redemption — SQL atómica con FOR UPDATE |
| Perfil del cliente (historial, saldo de puntos) | Fran | ✅ Completado | Mock data. Reemplazar cuando Kevin integre endpoints reales. |
| QR personal del cliente | Fran | ✅ Completado | SVG generado server-side con lib `qrcode` desde `profiles.qr_token` |
| Vista cajero: registrar consumo | Fran | ✅ Completado | `/caja`: búsqueda por QR/nombre, card cliente con saldo, form con preview de puntos en tiempo real. |
| Vista cajero: confirmar canje con código | Fran | ✅ Completado | /caja/canje — OTP 6 dígitos, confirm-redemption Edge Fn, success/error states, tab nav. **Probado end-to-end con datos reales (1 jul 2026)** |

### Semana 4 — División de cuenta + estadísticas + QA

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| División de cuenta (lógica proporcional) | Kevin | ✅ Completado | Edge Fn split-consumption — SQL atómica, session_id server-side |
| Ajuste manual de puntos (admin) | Kevin | ✅ Completado | Edge Fn adjust-points + SQL fn adjust_points — atómico, solo admin |
| Endpoints de reportes y estadísticas | Kevin | ✅ Completado | Edge Fn reports — 4 SQL fns en paralelo, solo admin |
| UI división de cuenta | Fran | ⬜ Pendiente | — |
| Dashboard de estadísticas | Fran | ✅ Completado | Integrado con Edge Fn `reports` real (no mock): KPIs, gráfico de consumos por día, top clientes, top recompensas. |
| Panel admin: búsqueda y gestión de clientes | Fran | ✅ Completado | Buscador por nombre/email (debounce URL), tabla con puntos, detalle con historial de consumos + form ajuste manual de puntos. |
| QA completo de todos los flujos | Kevin + Fran | ⬜ Pendiente | — |
| Deploy a producción | Kevin + Fran | ⬜ Pendiente | — |

---

## Bloqueos activos
_Ninguno crítico. El backend de Kevin está 100% completo. Fran puede integrar datos reales en cualquier momento._

## Integración pendiente (Fran reemplaza mocks por datos reales)
- ~~Carta pública → endpoints productos, categorías, time_offers, promotions~~ ✅ integrada
- Perfil cliente → `/rest/v1/points_balance` y `/rest/v1/points_transactions`
- Vista cajero → Edge Fn `register-consumption` (confirm-redemption ✅ probado)
- ~~Dashboard → Edge Fn `reports`~~ ✅ integrado
- División de cuenta → Edge Fn `split-consumption`

## Pendientes del cliente (Restaurante Isidoro)
- [ ] Fotos de todos los productos del menú
- [ ] Nombre, descripción y precio de cada producto
- [ ] Categorías del menú (ej: entradas, principales, postres, bebidas)
- [ ] Datos del administrador principal (email para crear cuenta admin)
- [ ] Dominio web contratado y apuntado

## Decisiones tomadas
_Ver DECISIONS.md_

---

## Leyenda de estado
| Símbolo | Significado |
|---|---|
| ⬜ Pendiente | No iniciado |
| 🔄 En progreso | En desarrollo activo |
| ✅ Completado | Terminado y testeado |
| 🔴 Bloqueado | Esperando dependencia |
| ⚠️ Riesgo | Requiere atención especial |