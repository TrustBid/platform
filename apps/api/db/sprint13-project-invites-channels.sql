-- Sprint 13: invitaciones por PROYECTO + soporte multi-canal (WhatsApp + Telegram)
--
-- - bot_invites.project_id: la invitación queda atada a un proyecto → el voluntario
--   enrolado por ese link NO tiene que escribir el código (su gasto va directo a ese proyecto).
-- - bot_enrollments generalizado a canal: channel + channel_user_id (teléfono para WA,
--   chat_id para Telegram) + default_project_id.

ALTER TABLE bot_invites
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Canal del submitter (para notificar el hash por WhatsApp o Telegram según corresponda).
-- submitter_phone se reusa como channel_user_id (teléfono en WA, chat_id en TG).
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS submitter_channel VARCHAR(16);

ALTER TABLE bot_enrollments
  ADD COLUMN IF NOT EXISTS channel             VARCHAR(16) NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS channel_user_id     VARCHAR(64),
  ADD COLUMN IF NOT EXISTS default_project_id  UUID REFERENCES projects(id);

-- Backfill: el channel_user_id de los enrolamientos WhatsApp existentes = dígitos del teléfono.
UPDATE bot_enrollments
   SET channel_user_id = regexp_replace(phone, '[^0-9]', '', 'g')
 WHERE channel_user_id IS NULL AND phone IS NOT NULL;

-- El teléfono deja de ser obligatorio/único (Telegram no tiene teléfono).
ALTER TABLE bot_enrollments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE bot_enrollments DROP CONSTRAINT IF EXISTS bot_enrollments_phone_key;

-- Identidad por canal + id de usuario del canal.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_enroll_channel_user
  ON bot_enrollments (channel, channel_user_id) WHERE channel_user_id IS NOT NULL;
