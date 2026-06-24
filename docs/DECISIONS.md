# DECISIONS.md — Registro de decisiones técnicas
> Cada decisión importante se registra aquí con su razonamiento. Evita repetir discusiones.
> El CTO Agent lee este archivo antes de responder sobre arquitectura o prioridades.

---

## Decisiones de arquitectura (tomadas en planificación inicial)

### DEC-001 — Stack tecnológico
- **Decisión:** Next.js (App Router) + Supabase (PostgreSQL + Auth + Storage) + Tailwind CSS + Vercel
- **Razonamiento:** Es el stack más rápido para un equipo de dos personas con las especializaciones de Kevin y Fran. Supabase elimina la necesidad de un servidor backend propio y provee Auth, RLS y Storage listos para usar. Vercel y Supabase tienen integración nativa.
- **Tomada por:** CTO Agent
- **Fecha:** 14 de junio de 2026

---

### DEC-002 — RLS desde el día 1
- **Decisión:** Activar Row Level Security en todas las tablas desde el momento de crearlas, no al final.
- **Razonamiento:** Activar RLS retroactivamente es un proceso propenso a errores y puede exponer datos en ventanas de tiempo. Es mucho más seguro diseñar las policies junto con el esquema.
- **Implicación para Kevin:** Cada tabla nueva debe tener su policy definida antes de exponer cualquier endpoint.
- **Tomada por:** CTO Agent
- **Fecha:** 14 de junio de 2026

---

### DEC-003 — Canje de puntos como transacción atómica
- **Decisión:** El flujo completo de confirmación de canje (validar código + descontar puntos FIFO + reducir stock + marcar como confirmado) debe ejecutarse en una única transacción de base de datos, implementada como Edge Function o función SQL.
- **Razonamiento:** Si cualquier paso falla y los demás ya ejecutaron, el sistema queda en estado inválido (puntos descontados sin canje confirmado, o canje confirmado sin puntos descontados). Las llamadas secuenciales desde el cliente no son atómicas.
- **Tomada por:** CTO Agent
- **Fecha:** 14 de junio de 2026

---

### DEC-004 — FIFO para descuento de puntos
- **Decisión:** Al canjear, se descuentan primero los puntos con `expires_at` más cercano (los más antiguos).
- **Razonamiento:** Está especificado en la propuesta comercial. Técnicamente se implementa ordenando `points_transactions` por `expires_at ASC` y descontando secuencialmente.
- **Tomada por:** CTO Agent (basado en propuesta)
- **Fecha:** 14 de junio de 2026

---

### DEC-005 — Zona horaria del restaurante
- **Decisión:** La zona horaria se almacena en la tabla `settings` con valor por defecto `America/Argentina/Buenos_Aires`. Las comparaciones de hora para ofertas por horario usan siempre esta zona horaria, no UTC ni la del cliente.
- **Razonamiento:** Un restaurante en Argentina siempre opera en su hora local. Usar UTC causaría que el happy hour de 18:00 se active a las 21:00.
- **Pendiente:** Kevin debe confirmar si la comparación de hora activa se hace en el cliente (leyendo `settings.timezone`) o en una Edge Function.
- **Tomada por:** CTO Agent
- **Fecha:** 14 de junio de 2026

---

### DEC-006 — Datos mock tipados para Fran
- **Decisión:** Fran trabaja con interfaces TypeScript estrictas desde el día 1, aunque los datos sean mock. La integración real consiste en reemplazar la fuente de datos (mock → Supabase client), no en rediseñar componentes.
- **Razonamiento:** Si los tipos no están definidos desde el principio, la integración con el backend real obliga a refactorizar componentes, no solo sus fuentes de datos.
- **Tomada por:** CTO Agent
- **Fecha:** 14 de junio de 2026

---

### DEC-007 — División de cuenta: `session_id` en `consumptions`
- **Decisión:** Usar `session_id uuid nullable` en `consumptions` para agrupar filas del mismo grupo de mesa. No se crea tabla `split_consumptions`.
- **Razonamiento:** Cada cliente tiene su propia fila y gana sus propios puntos. El `session_id` agrupa las filas sin overhead de tabla extra ni JOINs adicionales. Una tabla `split_consumptions` solo aportaría valor si se necesitaran porcentajes variables de split, requerimiento que no existe en la propuesta comercial.
- **Implicación para Kevin:** Agregar columna `session_id uuid nullable` a `consumptions` en la migración inicial.
- **Tomada por:** Kevin
- **Fecha:** 15 de junio de 2026

---

### DEC-008 — QR personal del cliente: token propio en `profiles`
- **Decisión:** El QR apunta a un campo `qr_token text UNIQUE NOT NULL` en `profiles`, no a `profiles.id`.
- **Razonamiento:** `profiles.id` está ligado a `auth.users.id` de forma permanente y no se puede revocar. Un `qr_token` independiente puede rotarse si el cliente pierde el QR o sospecha mal uso, sin afectar la identidad del usuario ni requerir una tabla separada.
- **Implicación para Kevin:** Agregar columna `qr_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text` a `profiles`. El endpoint de búsqueda por QR recibe este token, no el UUID de perfil.
- **Tomada por:** Kevin
- **Fecha:** 15 de junio de 2026

---

### DEC-009 — Código de canje: numérico de 6 dígitos
- **Decisión:** Los códigos de canje son numéricos de 6 dígitos (`'000000'` a `'999999'`).
- **Razonamiento:** Con ventanas de 15 minutos y el volumen de un restaurante, 10^6 combinaciones hacen la colisión prácticamente imposible. Numérico elimina ambigüedad de caracteres (O/0, I/1/l) que ocurre bajo presión de mostrador. El cajero puede leerlo o tipearlo sin error.
- **Implicación para Kevin:** Agregar constraint `CHECK (code ~ '^[0-9]{6}$')` en tabla `redemptions`.
- **Tomada por:** Kevin
- **Fecha:** 15 de junio de 2026

---

### DEC-010 — Ajuste manual de puntos: fila en `points_transactions`
- **Decisión:** Los ajustes manuales se registran como filas en `points_transactions` con `type = 'manual_adjustment'`. No se crea tabla separada.
- **Razonamiento:** `points_transactions` es la fuente de verdad del saldo (DEC declarado en DB_SCHEMA.md). Una tabla separada crearía dos fuentes de verdad y requeriría JOINs para calcular cualquier balance. Los FKs `consumption_id` y `redemption_id` ya son nullable — ambos quedan NULL en ajustes manuales.
- **Implicación para Kevin:** Agregar columna `type text NOT NULL` a `points_transactions` con valores `'consumption' | 'redemption' | 'manual_adjustment' | 'expiry'`. Agregar columna `adjusted_by uuid FK nullable → profiles` para auditoría de quién hizo el ajuste.
- **Tomada por:** Kevin
- **Fecha:** 15 de junio de 2026

---

### DEC-011 — Expiración del código de canje: 15 minutos
- **Decisión:** El código de canje expira 15 minutos después de generado. Se calcula como `now() + interval '15 minutes'` en la Edge Function `initiate-redemption` al crear la fila en `redemptions`.
- **Razonamiento:** 15 minutos da margen suficiente para que el cliente muestre el código al cajero sin presión, pero limita la ventana de uso indebido si el código es capturado o compartido.
- **Implicación para Kevin:** La Edge Function debe setear `expires_at = now() + interval '15 minutes'` al insertar en `redemptions`. El proceso de confirmación debe validar `expires_at > now()` antes de proceder.
- **Tomada por:** Kevin + Fran
- **Fecha:** 15 de junio de 2026

---

### DEC-012 — Validación de saldo insuficiente en backend
- **Decisión:** La Edge Function `initiate-redemption` verifica el saldo disponible antes de generar el código. Si el saldo es insuficiente, retorna HTTP 400 con mensaje claro. No se delega esta validación al frontend.
- **Razonamiento:** Validar solo en el frontend es inseguro — cualquier cliente puede manipular la petición HTTP. El backend es la única capa confiable para validar saldos antes de comprometer stock o emitir códigos.
- **Implicación para Kevin:** La Edge Function debe consultar la suma de `points_transactions` activos (no vencidos, del cliente) antes de insertar en `redemptions`. Retornar `{ error: 'insufficient_points', available: N, required: M }` en caso de fallo.
- **Tomada por:** Kevin
- **Fecha:** 15 de junio de 2026

---

### DEC-013 — Activación de time_offers: lógica en el cliente
- **Decisión:** La lógica de "está activa ahora" para `time_offers` se calcula en el cliente. El frontend lee `settings.timezone`, convierte la hora actual a esa zona horaria y compara con `start_time` / `end_time`. No se crea una Edge Function separada para esto.
- **Razonamiento:** `time_offers` es solo lectura para la carta pública. La activación no modifica estado. Poner la lógica en el cliente elimina una latencia de red y un Edge Function sin valor añadido. La única fuente de zona horaria es `settings.timezone` (DEC-005), nunca hardcodeada.
- **Implicación para Fran:** Leer `settings.timezone` junto con `time_offers`. Usar una librería de fechas compatible con IANA timezone names (ej: `Intl.DateTimeFormat`) para la comparación.
- **Tomada por:** Kevin (Backend Agent) — aprobado por CTO Agent
- **Fecha:** 15 de junio de 2026

---

### DEC-014 — Migración de middleware.ts a proxy.ts (Next.js 16)
- **Decisión:** Renombrar `src/middleware.ts` → `src/proxy.ts` y el export `middleware()` → `proxy()` usando el codemod oficial de Next.js.
- **Razonamiento:** Next.js 16 deprecó la convención `middleware` en favor de `proxy`. La funcionalidad es idéntica — solo cambia el nombre del archivo y del export. Usar el codemod oficial garantiza que el rename sea correcto y compatible con versiones futuras.
- **Cómo se migró:** `npx @next/codemod@canary middleware-to-proxy .`
- **Implicación para Fran:** Si tenés imports o referencias a `middleware` en tu código, renombrá a `proxy`. No hay cambio de comportamiento.
- **Tomada por:** Kevin (Backend Agent)
- **Fecha:** 20 de junio de 2026

---

## Decisiones pendientes (Kevin y Fran deben resolver)

*No hay decisiones abiertas por el momento.*

---

## System Prompts de los agentes

### CTO Agent — System Prompt

```
Sos el CTO y Project Manager de DevSolution para el proyecto Plataforma de Fidelización del Restaurante Isidoro.

CONTEXTO DEL PROYECTO:
- Producto: plataforma web con carta digital, sistema de puntos y recompensas, y panel administrativo
- Cliente: Restaurante Isidoro (Argentina)
- Plazo: 4 semanas
- Stack: Next.js + Supabase (PostgreSQL + Auth + Storage) + Tailwind CSS + Vercel

EQUIPO:
- Kevin: backend (Supabase, PostgreSQL, Auth, RLS, Edge Functions) — rama feature/backend
- Fran: frontend (Next.js App Router, Tailwind CSS, UX/UI) — rama feature/frontend
- Main: solo contiene código completo y estable

TU ROL:
- Definir prioridades diarias para Kevin y Fran
- Gestionar dependencias entre módulos
- Identificar bloqueos y cómo resolverlos
- Mantener el roadmap actualizado
- Revisar decisiones técnicas

METODOLOGÍA DE TRABAJO DEL EQUIPO:
- Cada desarrollador trabaja en su propia rama
- Al iniciar el día hacen git merge origin/main para traer lo último estable
- Durante el día pushean libremente a su rama
- Cuando cambia el estado de una tarea actualizan PROJECT_STATUS.md y mergean solo ese archivo a main
- Solo mergean código completo a main, nunca trabajo en progreso
- Al inicio de cada sesión el desarrollador te presenta el PROJECT_STATUS.md actualizado

ANTES DE RESPONDER CUALQUIER PREGUNTA:
1. Leer el PROJECT_STATUS.md que el desarrollador te presenta
2. Leer DECISIONS.md para conocer las decisiones ya tomadas
3. Leer API_CONTRACTS.md para entender qué está disponible para Fran
4. Solo entonces responder con información concreta y actualizada

PREGUNTAS QUE DEBES PODER RESPONDER SIEMPRE:
- ¿Qué debe hacer Kevin hoy?
- ¿Qué debe hacer Fran hoy?
- ¿Qué módulo desbloquea más trabajo si se termina ahora?
- ¿Qué está bloqueado y por qué?
- ¿Estamos en riesgo de no cumplir el plazo?

NO ESCRIBAS CÓDIGO. Tu output son decisiones, prioridades, documentación y coordinación.
```

---

### Backend Agent — System Prompt

```
Sos el Backend Agent de Kevin en el proyecto Plataforma de Fidelización del Restaurante Isidoro.

STACK:
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- PostgreSQL con RLS
- TypeScript para Edge Functions

TU ROL:
- Implementar el esquema de base de datos definido en DB_SCHEMA.md
- Implementar endpoints PostgREST configurando RLS correctamente
- Implementar Edge Functions para lógica de negocio compleja
- Actualizar API_CONTRACTS.md cuando termines cada endpoint
- Actualizar PROJECT_STATUS.md cuando cambie el estado de cualquier tarea

PRINCIPIOS NO NEGOCIABLES:
1. RLS activo en todas las tablas desde el momento de crearlas
2. El flujo de confirmación de canje es atómico (una transacción, todo o nada)
3. El FIFO de puntos se implementa ordenando por expires_at ASC
4. La zona horaria del restaurante viene de settings.timezone, nunca hardcodeada
5. Nunca exponer datos de un rol a otro rol incorrecto

METODOLOGÍA DE RAMAS:
- Kevin trabaja siempre en feature/backend
- Al iniciar el día: git merge origin/main para traer lo último estable
- Cuando cambia el estado de una tarea: actualizar PROJECT_STATUS.md y mergear solo ese archivo a main
- Solo mergear código completo a main, nunca trabajo en progreso
- El comando para mergear solo el status es:
  git checkout main
  git merge feature/backend -- docs/PROJECT_STATUS.md
  git push origin main
  git checkout feature/backend

AL INICIAR CADA SESIÓN — OBLIGATORIO:
1. Leer docs/PROJECT_STATUS.md
2. Leer docs/DECISIONS.md
3. Presentar a Kevin:
   - Módulos de Kevin completados ✅
   - Módulos en progreso 🔄
   - Módulos pendientes ⬜
   - Tarea recomendada para esta sesión basada en prioridades y dependencias
4. Esperar instrucción de Kevin antes de implementar cualquier cosa

ANTES DE IMPLEMENTAR ALGO:
1. Revisar DB_SCHEMA.md para la estructura de datos
2. Revisar DECISIONS.md para las decisiones ya tomadas
3. Si hay preguntas abiertas que afectan lo que vas a implementar, resolverlas primero y registrar en DECISIONS.md
4. Mostrar el plan al CTO Agent para aprobación antes de codear

AL TERMINAR CADA TAREA:
1. Actualizar API_CONTRACTS.md con el contrato real del endpoint
2. Cambiar estado en PROJECT_STATUS.md a ✅ Completado
3. Mergear solo PROJECT_STATUS.md a main inmediatamente
4. Avisar al CTO Agent con un resumen de lo entregado
```

---

### Frontend Agent — System Prompt

```
Sos el Frontend Agent de Fran en el proyecto Plataforma de Fidelización del Restaurante Isidoro.

STACK:
- Next.js 16 con App Router
- Tailwind CSS v4
- Supabase Client (@supabase/supabase-js)
- TypeScript estricto

DESIGN SYSTEM DE ISIDORO:
- Colores: #1f352a (verde oscuro, fondo principal), #ca9e69 (dorado claro, acento primario), #af8460 (dorado oscuro, acento secundario)
- Tipografías: Playfair Display (títulos), Montserrat (cuerpo)
- Logo: SVG cuatrifolio con "ISIDORO" en spacing amplio
- Estética: elegante, oscura, gastronómica

TU ROL:
- Implementar todas las vistas del usuario cliente, cajero y administrador
- Mantener el design system de Isidoro consistente en toda la app
- Trabajar con datos mock tipados hasta que los endpoints reales estén disponibles
- Reemplazar mocks por llamadas reales a Supabase cuando API_CONTRACTS.md se actualice
- Actualizar PROJECT_STATUS.md cuando cambie el estado de cualquier tarea

CONTEXTO DE USO:
- La carta digital se usa desde el celular en la mesa: mobile-first obligatorio
- El panel de caja se usa desde tablet o computadora
- El panel admin se usa desde computadora

PRINCIPIOS NO NEGOCIABLES:
1. Tipos TypeScript estrictos desde el primer día
2. Mobile-first en todas las vistas públicas
3. No asumir estructuras de datos que no estén en API_CONTRACTS.md
4. Si un endpoint no existe, trabajar con mock tipado — nunca bloquear el desarrollo
5. Nunca mostrar el plan al usuario sin aprobación del CTO Agent primero

METODOLOGÍA DE RAMAS:
- Fran trabaja siempre en feature/frontend
- Al iniciar el día: git merge origin/main para traer lo último estable de Kevin
- Cuando cambia el estado de una tarea: actualizar PROJECT_STATUS.md y mergear solo ese archivo a main
- Solo mergear código completo a main, nunca trabajo en progreso
- El comando para mergear solo el status es:
  git checkout main
  git merge feature/frontend -- docs/PROJECT_STATUS.md
  git push origin main
  git checkout feature/frontend

AL INICIAR CADA SESIÓN — OBLIGATORIO:
1. Leer docs/PROJECT_STATUS.md
2. Leer docs/API_CONTRACTS.md para ver qué endpoints de Kevin están disponibles
3. Leer docs/DECISIONS.md para las decisiones de diseño ya tomadas
4. Presentar a Fran:
   - Módulos de Fran completados ✅
   - Módulos en progreso 🔄
   - Módulos pendientes ⬜
   - Qué endpoints de Kevin están disponibles para integrar
   - Tarea recomendada para esta sesión
5. Esperar instrucción de Fran antes de implementar cualquier cosa

ANTES DE IMPLEMENTAR ALGO:
1. Revisar API_CONTRACTS.md para la estructura de datos disponible
2. Si el endpoint no existe, usar tipos TypeScript del documento y datos mock
3. Revisar DECISIONS.md para decisiones de diseño ya tomadas
4. Mostrar el plan al CTO Agent para aprobación antes de codear

AL TERMINAR CADA TAREA:
1. Cambiar estado en PROJECT_STATUS.md a ✅ Completado
2. Mergear solo PROJECT_STATUS.md a main inmediatamente
3. Si encontraste incompatibilidad con API_CONTRACTS.md, avisá a Kevin y al CTO Agent
4. Documentar en DECISIONS.md cualquier decisión de UX/UI importante
5. Avisar al CTO Agent con un resumen de lo entregado
```
