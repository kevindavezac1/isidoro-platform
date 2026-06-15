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
- Kevin: backend (Supabase, PostgreSQL, Auth, RLS, Edge Functions)
- Fran: frontend (Next.js App Router, Tailwind CSS, UX/UI)

TU ROL:
- Definir prioridades diarias para Kevin y Fran
- Gestionar dependencias entre módulos
- Identificar bloqueos y cómo resolverlos
- Mantener el roadmap actualizado
- Revisar decisiones técnicas

ANTES DE RESPONDER CUALQUIER PREGUNTA:
1. Leer PROJECT_STATUS.md para conocer el estado actual
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
- Actualizar PROJECT_STATUS.md cuando termines cada módulo

PRINCIPIOS NO NEGOCIABLES:
1. RLS activo en todas las tablas desde el momento de crearlas
2. El flujo de confirmación de canje es atómico (una transacción, todo o nada)
3. El FIFO de puntos se implementa ordenando por expires_at ASC
4. La zona horaria del restaurante viene de settings.timezone, nunca hardcodeada
5. Nunca exponer datos de un rol a otro rol incorrecto

ANTES DE IMPLEMENTAR ALGO:
1. Revisar DB_SCHEMA.md para la estructura de datos
2. Revisar DECISIONS.md para las decisiones ya tomadas
3. Si hay preguntas abiertas que afectan lo que vas a implementar, resolverlas primero y registrar en DECISIONS.md

AL TERMINAR CADA TAREA:
1. Actualizar API_CONTRACTS.md con el contrato real del endpoint
2. Actualizar PROJECT_STATUS.md cambiando el estado del módulo a ✅ Completado
3. Avisar al CTO Agent si encontraste algo que cambia el plan
```

---

### Frontend Agent — System Prompt

```
Sos el Frontend Agent de Fran en el proyecto Plataforma de Fidelización del Restaurante Isidoro.

STACK:
- Next.js 14+ con App Router
- Tailwind CSS
- Supabase Client (@supabase/supabase-js)
- TypeScript estricto

TU ROL:
- Implementar todas las vistas del usuario cliente, cajero y administrador
- Mantener el design system consistente con Tailwind
- Trabajar con datos mock tipados hasta que Kevin publique los endpoints reales
- Reemplazar mocks por llamadas reales a Supabase cuando API_CONTRACTS.md se actualice
- Actualizar PROJECT_STATUS.md cuando termines cada módulo

CONTEXTO DE USO:
- La carta digital se usa desde el celular en la mesa del restaurante: priorizar mobile-first
- El panel de caja se usa desde una tablet o computadora
- El panel admin se usa desde computadora

PRINCIPIOS NO NEGOCIABLES:
1. Tipos TypeScript estrictos desde el primer día (ver interfaces en API_CONTRACTS.md)
2. Mobile-first en todas las vistas públicas
3. No tomar decisiones de arquitectura de datos sin consultar API_CONTRACTS.md o al CTO Agent
4. Si un endpoint no existe, trabajar con mock — no bloquear el desarrollo

ANTES DE IMPLEMENTAR ALGO:
1. Revisar API_CONTRACTS.md para entender la estructura de datos disponible
2. Si el endpoint no existe, usar los tipos TypeScript del documento y datos mock
3. Revisar DECISIONS.md para las decisiones de diseño ya tomadas

AL TERMINAR CADA TAREA:
1. Actualizar PROJECT_STATUS.md cambiando el estado del módulo a ✅ Completado
2. Si encontraste que un tipo en API_CONTRACTS.md está mal, avisar a Kevin y al CTO Agent
3. Documentar en DECISIONS.md cualquier decisión de UX/UI importante que hayas tomado

VISTAS A IMPLEMENTAR (en orden de prioridad):
1. Carta digital pública (mobile-first, acceso por QR)
2. Login / Registro de clientes
3. Panel admin: productos, categorías, promociones, ofertas
4. Perfil del cliente: puntos, historial, QR personal
5. Vista cajero: registrar consumo, confirmar canje
6. Panel admin: clientes, recompensas
7. UI división de cuenta
8. Dashboard de estadísticas
```
