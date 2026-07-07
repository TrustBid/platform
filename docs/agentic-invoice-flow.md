# Plan de implementación — Flujo Agéntico de Captura de Facturas (WhatsApp/Telegram)

> Nombre de marketing propuesto: **"Agente de Rendición"** / **Captura Agéntica** — *captura por chat con IA, control humano on-chain.*

## 1. Objetivo

Que **cualquier voluntario/empleado** de una ONG pueda rendir un gasto **sacando una foto de la factura y enviándola a un bot de WhatsApp/Telegram**, sin instalar app ni loguearse. El bot extrae los datos con IA, el voluntario confirma, y la transacción cae como **pendiente de aprobación** en el dashboard del admin. El admin valida con su firma (dual control) → se ancla on-chain → el bot le avisa el **hash** al voluntario.

## 2. Cómo encaja con lo YA construido (clave: reusa ~80%)

El doble control ya implementado y probado (crear → `pending` → aprobar → anclar → notificar) **es exactamente este modelo**. El bot es solo **otro "creador"**:

```
Voluntario (bot)  →  crea transacción PENDING (created_by = voluntario)
Admin (dashboard) →  aprueba (approver ≠ creador → dual control satisfecho)  →  ancla on-chain
Bot               →  notifica el tx_hash al voluntario
```

Endpoints existentes reutilizados: `POST /my/projects/:id/transactions` (crear pending), `PATCH .../:txId/approve` (aprobar+anclar), la sección de pendientes del dashboard, la extracción con Gemini y el anclaje `expense-anchor`.

**Trabajo nuevo real:** el bot (webhook + máquina de estados) y la **identidad/autorización del voluntario**.

## 3. Arquitectura

```
WhatsApp / Telegram
      │ (webhook: foto + mensajes)
      ▼
Bot Service  ── (Cloudflare Worker o módulo NestJS `bot/`)
      │  1. recibe foto → GeminiService.extractInvoice
      │  2. responde datos extraídos → voluntario CONFIRMA/corrige
      │  3. crea transacción PENDING vía API interna (a nombre del voluntario)
      │  4. escucha aprobación (evento/polling) → envía tx_hash al voluntario
      ▼
API NestJS (existente)  →  Neon  →  expense-anchor (Stellar)
```

- **Máquina de estados de la conversación** (por chat): `idle → esperando_confirmación → enviada`. Estado en Redis (ya está en el stack) o D1/KV.
- **Storage de la foto:** R2 (mismo bucket `trustbid-invoices`, content-addressed por hash) — reusa `StorageService`.

## 4. Identidad y autorización del voluntario (la pieza delicada)

Sin esto, cualquiera podría mandar facturas. Diseño:
- Tabla `bot_enrollments`: `{ phone (o telegram_id), organization_id, name, project_ids?, status, invited_by, created_at }`.
- **Onboarding:** el admin, desde el dashboard, invita a un voluntario por número/usuario → el bot lo reconoce en el primer mensaje (o el voluntario manda un código de invitación de un solo uso).
- El voluntario **solo puede crear pending** (rol `voluntario`, nunca aprueba). El admin/auditor aprueba. Encaja con `@Roles` existente (agregar rol `voluntario`).
- Números no enrolados → el bot los ignora o pide código.

## 5. Fases

### Fase 0 — MVP en Telegram (validar interés, ~gratis)
- Bot con BotFather (token gratis, sin verificación).
- Webhook (NestJS `bot/` o Worker) → recibe foto → Gemini → confirma → crea pending → notifica hash al aprobar.
- Enrolamiento mínimo (código de invitación).
- **Meta:** una ONG piloto rinde 10-20 gastos por Telegram end-to-end.

### Fase 1 — WhatsApp (donde está la gente en Latam)
- Meta WhatsApp Cloud API: número dedicado + verificación de negocio (unos días).
- Mismo webhook, adaptador de WhatsApp.
- Plantillas (templates) aprobadas para el mensaje de confirmación del hash fuera de la ventana de 24h.

### Fase 2 — Robustez / producto
- Reintentos de OCR, fotos múltiples por factura, categorización automática.
- Panel de enrolamiento de voluntarios en el dashboard.
- Métricas: tiempo de rendición, tasa de aprobación, gastos por voluntario.

## 6. Costos (realistas)

| Componente | Costo |
|---|---|
| Telegram Bot API | $0 |
| WhatsApp Cloud API | Mensajes iniciados por el usuario (la foto) → gratis dentro de 24h. Aviso del hash fuera de 24h → ~$0.005–0.04/msg (Latam barato). Decenas/cientos de facturas/mes → pocos USD/mes. Requiere número + verificación Meta. |
| Gemini OCR | ~$0.001 por factura (Flash) — despreciable |
| Hosting del bot | ~$0 (Worker CF / API existente) |
| R2 (foto) | Dentro del tier gratis (10 GB) |

**Costo dominante = casi nulo.** El "costo" real de WhatsApp es el **setup** (número + verificación), no el uso.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| OCR falla con fotos malas | Paso "confirmá los datos" (el voluntario corrige antes de enviar) |
| Fraude / facturas falsas | El voluntario NO aprueba; admin valida con firma + hash on-chain (humano-en-el-loop) |
| Onboarding de voluntarios | Enrolamiento por invitación del admin; whitelist de números |
| WhatsApp setup lento | Empezar en Telegram (Fase 0) mientras se tramita Meta |
| Costo mensajes salientes | Responder dentro de la ventana de 24h; templates solo para el hash |

## 8. Naming / marketing

- Enmarcar como **"Agente de IA que captura y pre-valida gastos, con control humano y verificación blockchain"**.
- El **control humano + hash on-chain** es el argumento de venta a donantes (transparencia real), no esconderlo.
- Opciones de nombre: *TrustBot*, *Agente de Rendición*, *Captura Agéntica*.

## 9. Estimación de esfuerzo (orden de magnitud)

- **Fase 0 (Telegram MVP):** módulo `bot/` + webhook + máquina de estados + enrolamiento mínimo + reuso de pending/approve. **~1 sprint.**
- **Fase 1 (WhatsApp):** adaptador + verificación Meta + templates. **~1 sprint** (+ tiempo de verificación de Meta, en paralelo).
- **Fase 2:** iterativo.

## 10. Decisiones abiertas para el usuario
- ¿Telegram MVP primero (recomendado) o directo WhatsApp?
- Modelo de enrolamiento (invitación del admin vs código de un solo uso).
- Anclaje: caller = server (funciona ya) vs KMS custodial por org (atribuye a la org).
