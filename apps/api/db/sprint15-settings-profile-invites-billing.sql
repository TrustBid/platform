-- Sprint 15: completar las pantallas de Configuración del diseño
--
-- Lo que faltaba para que cada control tuviera dónde guardar:
--
-- 1. Organización: misión, logo, zona horaria e idioma.
-- 2. Invitaciones de usuario por correo (el alta hoy sólo pasa por registro).
-- 3. Facturación: planes, suscripción de la organización e historial de cobros.
--
-- Aditivo e idempotente. No toca datos existentes.

-- ── 1. Perfil de organización ────────────────────────────────────────────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mission   TEXT,
  ADD COLUMN IF NOT EXISTS logo_url  TEXT,
  ADD COLUMN IF NOT EXISTS timezone  VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
  ADD COLUMN IF NOT EXISTS language  VARCHAR(8)  NOT NULL DEFAULT 'es';

-- ── 2. Invitaciones de usuario ───────────────────────────────────────────────
-- Distinto de `bot_invites`, que enrola voluntarios al bot de WhatsApp: esto
-- da de alta una persona con rol dentro de la organización.

CREATE TABLE IF NOT EXISTS user_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'responsable',
  token           VARCHAR(64) UNIQUE NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Una sola invitación viva por correo y organización.
  CONSTRAINT user_invites_pending_unique UNIQUE (organization_id, email, status)
);

CREATE INDEX IF NOT EXISTS idx_user_invites_org ON user_invites (organization_id);

-- ── 3. Facturación ───────────────────────────────────────────────────────────
-- `plans` ya existía pero son planes de trabajo (programa, fechas), no de
-- cobro. Estas tablas son el dominio de suscripción, separado.

CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  billing_period  VARCHAR(16) NOT NULL DEFAULT 'monthly',
  -- NULL = ilimitado.
  max_projects    INTEGER,
  max_users       INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  status            VARCHAR(16) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'cancelled')),
  current_period_end DATE,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount_cents    INTEGER NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  status          VARCHAR(16) NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('paid', 'pending', 'failed')),
  paid_at         DATE NOT NULL,
  invoice_url     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_org
  ON subscription_payments (organization_id, paid_at DESC);

-- Planes iniciales. Los precios y límites salen del diseño de UI Screens v1
-- (plan Profesional a $49/mes con 10 proyectos y 10 usuarios); ajustalos acá
-- cuando el modelo comercial cambie.
INSERT INTO subscription_plans (code, name, price_cents, max_projects, max_users)
VALUES
  ('free',         'Gratuito',    0,    3,    3),
  ('profesional',  'Profesional', 4900, 10,   10),
  ('institucional','Institucional', 19900, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Toda organización sin suscripción arranca en el plan gratuito.
INSERT INTO organization_subscriptions (organization_id, plan_id, current_period_end)
SELECT o.id, p.id, (CURRENT_DATE + INTERVAL '1 month')::date
FROM organizations o
CROSS JOIN subscription_plans p
WHERE p.code = 'free'
ON CONFLICT (organization_id) DO NOTHING;
