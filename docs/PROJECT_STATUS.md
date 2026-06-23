# PROJECT_STATUS.md — Plataforma Isidoro
> Actualizar al iniciar y cerrar cada jornada. El CTO Agent lee este archivo antes de responder cualquier pregunta.

**Última actualización:** 23 de junio de 2026 — Frontend Agent (Fran) — sesión 4
**Estado general:** EN CURSO — Semana 1
**Semana actual:** 1 de 4
**Riesgo de plazo:** Bajo

---

## Estado por módulo

### Semana 1 — Fundamentos (bloqueantes)

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Setup Supabase + proyecto | Kevin | ✅ Completado | Proyecto creado, CLI instalado |
| Esquema de base de datos | Kevin | ✅ Completado | 11 tablas + trigger handle_new_user en prod |
| Auth: email/password | Kevin | ✅ Completado | Supabase Auth activo + trigger crea perfil automáticamente |
| Auth: Google OAuth | Kevin | ✅ Completado | Credenciales configuradas en Google Cloud Console y Supabase Dashboard |
| RLS base (roles: cliente, cajero, admin) | Kevin | ✅ Completado | Policies activas en todas las tablas |
| Setup Next.js + estructura de carpetas | Kevin + Fran | ✅ Completado | Next.js 16 + Supabase clients + tipos TypeScript del schema |
| Design system (colores, tipografía, Tailwind) | Fran | ✅ Completado | Tokens en globals.css, paleta cálida restaurante |
| Layout base (nav, estructura de páginas) | Fran | ✅ Completado | Route groups (public/cliente/cajero/admin), redirect / → /carta |
| Carta pública con datos mock + QR estático | Fran | ✅ Completado | Mobile-first, menú hamburguesa, carrusel promos, ícono usuario, puntos por producto, precio con descuento |

### Auth (adelantado de S2, desbloqueado por Kevin en S1)

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Login email/password + Google OAuth | Fran | ✅ Completado | Redirect por rol. Ruta `/auth/callback` para OAuth. |
| Registro email/password + Google OAuth | Fran | ✅ Completado | `full_name` en `options.data`. Maneja email confirm + auto-login. |

### Semana 2 — Carta digital + gestión de productos

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| API productos (CRUD) | Kevin | ⬜ Pendiente | Desbloquea trabajo de Fran |
| API categorías (CRUD) | Kevin | ⬜ Pendiente | — |
| API promociones con fechas | Kevin | ⬜ Pendiente | — |
| API ofertas por horario + activación automática | Kevin | ⬜ Pendiente | ⚠️ Riesgo: zona horaria |
| Carta pública con datos reales + categorías | Fran | ⬜ Pendiente | Depende de API productos |
| Panel admin: gestión de productos | Fran | ⬜ Pendiente | — |
| Panel admin: gestión de categorías | Fran | ⬜ Pendiente | — |
| Panel admin: promociones y ofertas por horario | Fran | ⬜ Pendiente | — |
| QR dinámico funcional | Fran | ⬜ Pendiente | — |

### Semana 3 — Sistema de puntos + caja

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Lógica de acreditación de puntos | Kevin | ⬜ Pendiente | Equivalencia configurable |
| Vencimiento de puntos (FIFO, 12 meses) | Kevin | ⬜ Pendiente | ⚠️ Debe ser atómico |
| Recompensas con stock opcional | Kevin | ⬜ Pendiente | — |
| Generación de código de canje (6 dígitos) | Kevin | ⬜ Pendiente | — |
| Confirmación de canje por cajero | Kevin | ⬜ Pendiente | ⚠️ Transacción atómica obligatoria |
| Perfil del cliente (historial, saldo de puntos) | Fran | ✅ Completado | Mock data. Reemplazar cuando Kevin publique `/rest/v1/points_balance` y `/rest/v1/points_transactions` |
| QR personal del cliente | Fran | ✅ Completado | SVG generado server-side con lib `qrcode` desde `profiles.qr_token` (dato real de Supabase) |
| Vista cajero: registrar consumo | Fran | ⬜ Pendiente | — |
| Vista cajero: confirmar canje con código | Fran | ⬜ Pendiente | — |

### Semana 4 — División de cuenta + estadísticas + QA

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| División de cuenta (lógica proporcional) | Kevin | ⬜ Pendiente | — |
| Ajuste manual de puntos (admin) | Kevin | ⬜ Pendiente | — |
| Endpoints de reportes y estadísticas | Kevin | ⬜ Pendiente | — |
| UI división de cuenta | Fran | ⬜ Pendiente | — |
| Dashboard de estadísticas | Fran | ⬜ Pendiente | — |
| Panel admin: búsqueda y gestión de clientes | Fran | ⬜ Pendiente | — |
| QA completo de todos los flujos | Kevin + Fran | ⬜ Pendiente | — |
| Deploy a producción | Kevin + Fran | ⬜ Pendiente | — |

---

## Bloqueos activos
- **⚠️ Kevin: `middleware.ts` usa convención deprecated en Next.js 16.** Renombrar a `proxy.ts` y la función a `proxy`. Ver docs: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- **⚠️ Kevin: agregar `price_override NUMERIC(10,2) NULLABLE` a `time_offer_products`** para que el descuento de precios funcione con datos reales. Ver DEC-020.

## Pendientes del cliente (Restaurante Isidoro)
- [ ] Fotos de todos los productos del menú
- [ ] Nombre, descripción y precio de cada producto
- [ ] Categorías del menú (ej: entradas, principales, postres, bebidas)
- [ ] Logo del restaurante en alta resolución
- [ ] Datos del administrador principal (email para crear cuenta admin)
- [ ] Zona horaria del restaurante (para ofertas por horario)
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
