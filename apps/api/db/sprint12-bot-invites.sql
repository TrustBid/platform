-- Sprint 12: auto-enrolamiento de voluntarios por link de invitación
--
-- El admin genera una invitación (código). Comparte el link wa.me/<bot>?text=ALTA-<code>.
-- El voluntario lo toca y envía → el bot lo agrega solo a bot_enrollments (self-service,
-- auto-verificado porque el mensaje viene de su propio número).

CREATE TABLE IF NOT EXISTS bot_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(24) UNIQUE NOT NULL,          -- ej ALTA-7F3K9Q
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by      UUID REFERENCES users(id),
  label           VARCHAR(120),                         -- ej "Voluntarios brigada norte"
  max_uses        INT NOT NULL DEFAULT 100,
  uses            INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMP,
  status          VARCHAR(16) NOT NULL DEFAULT 'active', -- active | revoked
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bot_invites_org ON bot_invites (organization_id);
CREATE INDEX IF NOT EXISTS idx_bot_invites_code ON bot_invites (upper(code));
