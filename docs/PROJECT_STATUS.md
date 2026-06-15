# PROJECT_STATUS.md — Plataforma Isidoro
> Actualizar al iniciar y cerrar cada jornada. El CTO Agent lee este archivo antes de responder cualquier pregunta.

**Última actualización:** 15 de junio de 2026 — tarde (Backend Agent)
**Estado general:** EN CURSO — Semana 2
**Semana actual:** 2 de 4
**Riesgo de plazo:** Bajo

---

## Estado por módulo

### Semana 1 — Fundamentos (bloqueantes)

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Setup Supabase + proyecto | Kevin | ✅ Completado | Proyecto creado, CLI instalado |
| Esquema de base de datos | Kevin | ✅ Completado | 12 tablas + RLS en todas + índices |
| Trigger handle_new_user | Kevin | ✅ Completado | Migration 000001: crea profile + points_balance en signup |
| Auth: email/password | Kevin | ✅ Completado | Supabase Auth activo + trigger crea perfil automáticamente |
| Auth: Google OAuth | Kevin | ✅ Completado | Credenciales configuradas en Google Cloud Console y Supabase Dashboard |
| RLS base (roles: cliente, cajero, admin) | Kevin | ✅ Completado | Policies activas en todas las tablas |
| Setup Next.js + estructura de carpetas | Kevin + Fran | ✅ Completado | Next.js 16 + Supabase clients + tipos TypeScript del schema |
| Design system (colores, tipografía, Tailwind) | Fran | ⬜ Pendiente | — |
| Layout base (nav, estructura de páginas) | Fran | ⬜ Pendiente | — |
| Carta pública con datos mock + QR estático | Fran | ⬜ Pendiente | — |

### Semana 2 — Carta digital + gestión de productos

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| API productos (CRUD) | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API categorías (CRUD) | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API promociones con fechas | Kevin | ✅ Completado | PostgREST vía RLS — contratos en API_CONTRACTS.md |
| API ofertas por horario | Kevin | ✅ Completado | PostgREST + activación en cliente (DEC-013) |
| Carta pública con datos reales + categorías | Fran | ⬜ Pendiente | Depende de API productos |
| Panel admin: gestión de productos | Fran | ⬜ Pendiente | — |
| Panel admin: gestión de categorías | Fran | ⬜ Pendiente | — |
| Panel admin: promociones y ofertas por horario | Fran | ⬜ Pendiente | — |
| QR dinámico funcional | Fran | ⬜ Pendiente | — |

### Semana 3 — Sistema de puntos + caja

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| Lógica de acreditación de puntos | Kevin | ✅ Completado | register_consumption SQL fn — atómico |
| Vencimiento de puntos (FIFO, 12 meses) | Kevin | ✅ Completado | FIFO en confirm_redemption + expires_at en créditos |
| Recompensas con stock opcional | Kevin | ✅ Completado | PostgREST + stock decrementado en confirm_redemption |
| Generación de código de canje (6 dígitos) | Kevin | ✅ Completado | Edge Fn initiate-redemption — crypto.getRandomValues |
| Confirmación de canje por cajero | Kevin | ✅ Completado | Edge Fn confirm-redemption — SQL atómica con FOR UPDATE |
| Perfil del cliente (historial, saldo de puntos) | Fran | ⬜ Pendiente | — |
| QR personal del cliente | Fran | ⬜ Pendiente | — |
| Vista cajero: registrar consumo | Fran | ⬜ Pendiente | — |
| Vista cajero: confirmar canje con código | Fran | ⬜ Pendiente | — |

### Semana 4 — División de cuenta + estadísticas + QA

| Módulo | Responsable | Estado | Notas |
|---|---|---|---|
| División de cuenta (lógica proporcional) | Kevin | ✅ Completado | Edge Fn split-consumption — SQL atómica, session_id server-side |
| Ajuste manual de puntos (admin) | Kevin | ⬜ Pendiente | — |
| Endpoints de reportes y estadísticas | Kevin | ✅ Completado | Edge Fn reports — 4 SQL fns en paralelo, solo admin |
| UI división de cuenta | Fran | ⬜ Pendiente | — |
| Dashboard de estadísticas | Fran | ⬜ Pendiente | — |
| Panel admin: búsqueda y gestión de clientes | Fran | ⬜ Pendiente | — |
| QA completo de todos los flujos | Kevin + Fran | ⬜ Pendiente | — |
| Deploy a producción | Kevin + Fran | ⬜ Pendiente | — |

---

## Bloqueos activos
_Ninguno. Fran puede integrar con datos reales — todos los contratos de Semana 2 y Semana 3 están publicados en API_CONTRACTS.md._

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
