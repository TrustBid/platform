-- Sprint 10: veracidad de facturas — validación con IA + atestación + doble control
--
-- Añade a `transactions`:
--   settlement_type : cómo se liquidó el gasto (on_chain = pago Stellar verificable,
--                     cash = efectivo/off-chain, solo atestiguado)
--   storage_key     : clave del comprobante en Cloudflare R2 (content-addressed por hash)
--   ai_*            : resultado de la extracción/validación con Gemini
--   approved_by/at  : doble control — quién aprobó (rol distinto al creador) y cuándo;
--                     el anclaje on-chain ocurre recién al aprobar
--
-- Rol nuevo para el segundo control.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'auditor';

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS settlement_type TEXT NOT NULL DEFAULT 'on_chain',
  ADD COLUMN IF NOT EXISTS storage_key      TEXT,
  ADD COLUMN IF NOT EXISTS ai_extracted     JSONB,
  ADD COLUMN IF NOT EXISTS ai_amount        NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_match         BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_confidence    NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_flags         TEXT,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMP;
