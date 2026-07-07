-- Sprint 11: flujo agéntico de captura de facturas por WhatsApp
--
-- - Rol 'voluntario': crea transacciones (por bot) pero NO aprueba (doble control).
-- - projects.code: código corto por proyecto que el voluntario tipea para elegir destino.
-- - transactions.submitter_phone: teléfono del voluntario, para notificarle el hash al aprobar.
-- - bot_enrollments: whitelist teléfono → org → usuario voluntario.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'voluntario';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS code VARCHAR(16);

-- Código único por organización (case-insensitive), solo cuando está seteado.
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_code
  ON projects (organization_id, upper(code))
  WHERE code IS NOT NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(32);

CREATE TABLE IF NOT EXISTS bot_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(32) UNIQUE NOT NULL,          -- E.164, ej +573001112233
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID NOT NULL REFERENCES users(id),   -- usuario 'voluntario' de la org
  name            VARCHAR(255),
  status          VARCHAR(16) NOT NULL DEFAULT 'active', -- active | disabled
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bot_enrollments_phone ON bot_enrollments (phone);
