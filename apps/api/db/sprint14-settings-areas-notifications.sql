-- Sprint 14: hacer funcionales las pantallas de Configuración
--
-- Tres cosas que la UI necesitaba y el esquema no tenía:
--
-- 1. `areas` sólo guardaba nombre y responsable. La pantalla muestra además una
--    descripción y el presupuesto asignado.
-- 2. No había forma de saber cuánto ejecutó un área: ni `transactions` ni
--    `projects` referencian un área. Se agrega `transactions.area_id` para poder
--    derivar el ejecutado sumando los movimientos confirmados.
-- 3. Las preferencias de notificación no se guardaban en ningún lado.
--
-- Todo aditivo e idempotente: no toca datos existentes.

-- ── 1. Áreas: descripción y presupuesto ──────────────────────────────────────

ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(20, 2) NOT NULL DEFAULT 0
    CHECK (budget_amount >= 0);

-- ── 2. Vínculo gasto → área ──────────────────────────────────────────────────
-- Nullable a propósito: los movimientos ya registrados no tienen área, y un
-- gasto puede seguir sin asignarse a ninguna.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_area_id ON transactions (area_id);

-- ── 3. Preferencias de notificación ──────────────────────────────────────────
-- Una fila por (organización, evento, canal). Se guardan a nivel organización,
-- que es como lo plantea la pantalla: no hay preferencias por usuario todavía.

CREATE TABLE IF NOT EXISTS notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_key       VARCHAR(64)  NOT NULL,
  channel         VARCHAR(16)  NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_prefs_unique UNIQUE (organization_id, event_key, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_org
  ON notification_preferences (organization_id);
