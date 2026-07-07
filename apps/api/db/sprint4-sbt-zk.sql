-- TrustBid — Schema Sprint 4: Reputación SBT + Credenciales ZK (Soroban)
-- Ejecutar DESPUÉS de init-db.sql y sprint3-schema.sql
--
-- Propósito:
--   SBT (Soulbound Token): insignia no transferible emitida on-chain en Soroban
--   que certifica el estado de reputación/verificación de una organización.
--
--   ZK Proof: prueba de conocimiento cero que ancla en Soroban un compromiso
--   criptográfico (commitment hash) sin revelar los datos subyacentes.
--   La prueba completa se almacena en R2. El contrato Soroban solo almacena
--   el hash del commitment — suficiente para verificación independiente.
--
-- Uso:
--   docker cp scripts/sprint4-sbt-zk.sql trustbid_postgres:/tmp/sprint4-sbt-zk.sql
--   docker exec -it trustbid_postgres psql -U postgres -d trustbid -f /tmp/sprint4-sbt-zk.sql

-- ============================================================
-- PASO 0 — Nuevos enums (FUERA de transacción)
-- ============================================================

-- Tipo de insignia SBT
CREATE TYPE badge_type AS ENUM (
  'kyb_verified',        -- KYB/KYC de la organización aprobado (Flujo C)
  'transparency_bronze', -- ≥3 meses de reportes compliant
  'transparency_silver', -- ≥6 meses + auditoría interna
  'transparency_gold',   -- ≥12 meses + auditoría externa aprobada
  -- audit_passed removido: não existe no contrato sbt-badge on-chain
);

-- Estado del ciclo de vida del SBT
CREATE TYPE badge_status AS ENUM (
  'pending',   -- solicitud creada, esperando confirmación on-chain
  'issued',    -- confirmado en ledger Soroban
  'revoked',   -- revocado (nueva tx on-chain, no se borra el original)
  'expired'    -- expiró por tiempo (solo badges con expires_at)
);

-- Tipo de credencial ZK que se está probando
CREATE TYPE zk_credential_type AS ENUM (
  'donor_privacy',      -- prueba que una donación existió sin revelar el donante
  'budget_compliance',  -- prueba que el gasto ≤ presupuesto sin revelar montos
  'impact_threshold',   -- prueba que indicadores superan un umbral sin revelar el valor exacto
  'audit_trail'         -- prueba de cadena de custodia de evidencias
);

-- Estado de la prueba ZK
CREATE TYPE zk_proof_status AS ENUM (
  'computing',   -- Worker ZK está generando la prueba
  'anchoring',   -- proof generada, enviando a Soroban
  'anchored',    -- commitment hash confirmado on-chain
  'failed'       -- error irrecuperable en generación o anclaje
);

BEGIN;

-- ============================================================
-- 1. ORGANIZATION_BADGES — SBTs emitidos a organizaciones
-- ============================================================
-- Un badge es emitido por el contrato Soroban de reputación.
-- No es transferible (Soulbound): el contrato lo rechaza si se intenta mover.
-- Prerrequisito: Flujo C (KYC/KYB aprobado) para badge_type = 'kyb_verified'.
-- Los demás badges se emiten automáticamente según reglas de negocio
-- calculadas por el módulo Blockchain sobre datos de DB.
CREATE TABLE organization_badges (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Qué tipo de insignia y su estado actual
  badge_type       badge_type  NOT NULL,
  status           badge_status NOT NULL DEFAULT 'pending',

  -- Referencia al contrato Soroban y al token emitido
  contract_id      VARCHAR(256) NOT NULL,           -- dirección del contrato SBT en Soroban
  token_id         VARCHAR(256),                    -- ID del token dentro del contrato (disponible tras issued)

  -- Anclaje on-chain
  anchor_tx_hash   VARCHAR(256),                    -- tx hash de la emisión en Stellar
  stellar_ledger   BIGINT,                          -- ledger en que se confirmó

  -- Metadatos del badge
  metadata_url     TEXT,                            -- JSON en R2 (nombre, descripción, criterios)
  issued_at        TIMESTAMPTZ,                     -- timestamp de confirmación on-chain
  expires_at       TIMESTAMPTZ,                     -- NULL = sin expiración

  -- Trazabilidad interna
  issued_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Un badge del mismo tipo no puede estar vigente dos veces para la misma org
  CONSTRAINT org_badge_type_unique UNIQUE (organization_id, badge_type, status)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_org_badges_org ON organization_badges (organization_id);
CREATE INDEX idx_org_badges_status ON organization_badges (status);

-- ============================================================
-- 2. ZK_PROOFS — credenciales de conocimiento cero
-- ============================================================
-- Flujo:
--   1. API calcula el commitment_hash (hash de los datos reales).
--   2. Worker ZK genera la prueba completa (zk-SNARK/STARK offchain).
--   3. proof_artifact_url apunta al JSON completo en R2 (inputs públicos + prueba).
--   4. El contrato Soroban almacena solo el commitment_hash + tipo.
--   5. Cualquier auditor puede descargar la prueba de R2 y verificarla
--      contra el commitment on-chain sin necesitar los datos originales.
CREATE TABLE zk_proofs (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID               NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  credential_type     zk_credential_type NOT NULL,
  status              zk_proof_status    NOT NULL DEFAULT 'computing',

  -- El commitment es público y no revela nada por sí solo
  commitment_hash     VARCHAR(256)       NOT NULL,   -- hash determinístico de los datos privados
  public_inputs       JSONB,                         -- inputs públicos del circuito ZK (no sensibles)

  -- Artefacto de la prueba (almacenado en R2, no en DB)
  proof_artifact_url  TEXT,                          -- URL firmada R2 del JSON de la prueba completa

  -- Anclaje Soroban
  contract_id         VARCHAR(256),                  -- contrato Soroban de verificación ZK
  anchor_tx_hash      VARCHAR(256),                  -- tx que ancló el commitment on-chain
  stellar_ledger      BIGINT,

  -- Ventana de validez
  generated_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,

  -- Trazabilidad
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT zk_commitment_unique UNIQUE (commitment_hash)
);

CREATE INDEX idx_zk_proofs_org ON zk_proofs (organization_id);
CREATE INDEX idx_zk_proofs_status ON zk_proofs (status);
CREATE INDEX idx_zk_proofs_type ON zk_proofs (credential_type);

-- ============================================================
-- RLS — nuevas tablas aisladas por organization_id
-- ============================================================
ALTER TABLE organization_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_proofs           ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_badges_isolation ON organization_badges
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK  (organization_id = app.current_organization_id());

CREATE POLICY zk_proofs_isolation ON zk_proofs
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK  (organization_id = app.current_organization_id());

COMMIT;
