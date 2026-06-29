-- TrustBid — Schema Sprint 3 (entidades faltantes del discovery)
-- Ejecutar DESPUÉS de init-db.sql (Sprint 1+2)
-- Discovery: Felipe Tamayo (Latir), Laura Lucía (ACAPS), Sergio Guzmán (Wills Wilde), Ramiro Pérez (TECHO)
--
-- Uso:
--   docker cp scripts/sprint3-schema.sql trustbid_postgres:/tmp/sprint3-schema.sql
--   docker exec -it trustbid_postgres psql -U postgres -d trustbid -f /tmp/sprint3-schema.sql

-- ============================================================
-- PASO 0 — Ampliar enums existentes (FUERA de transacción)
-- ALTER TYPE ADD VALUE no puede ejecutarse dentro de BEGIN/COMMIT en PostgreSQL.
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contador';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin_regional';

BEGIN;

-- ============================================================
-- NUEVOS ENUMS
-- ============================================================
CREATE TYPE funding_source_type AS ENUM (
  'international_org', 'government', 'corporate', 'individual', 'event', 'other'
);

CREATE TYPE template_format AS ENUM ('eu', 'usaid', 'idb', 'custom');

-- Pipeline OCR de facturas (requisito transversal — 3/4 entrevistas)
-- pending → extracted (OCR procesó) → validated (contador aprueba) | rejected
CREATE TYPE ocr_status AS ENUM ('pending', 'extracted', 'validated', 'rejected');

-- ============================================================
-- 1. PLANS — planes estratégicos (nivel 1 de jerarquía)
-- ============================================================
-- Estructura: Plan → Programa → Proyecto (3 niveles)
-- Organizaciones simples (Latir, Wills Wilde) pueden omitir Plan/Programa
-- y vincular proyectos directamente a la organización.
CREATE TABLE plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  start_date       DATE,
  end_date         DATE,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_organization_id ON plans (organization_id);

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. PROGRAMS — programas temáticos (nivel 2 de jerarquía)
-- ============================================================
CREATE TABLE programs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id          UUID REFERENCES plans(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  start_date       DATE,
  end_date         DATE,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_programs_organization_id ON programs (organization_id);
CREATE INDEX idx_programs_plan_id ON programs (plan_id);

CREATE TRIGGER trg_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. AREAS — unidades organizacionales (estructura interna)
-- ============================================================
-- Separado de 'accounts' (que es cuenta financiera).
-- Soporta jerarquía variable: 2 niveles (fundación→área) o 3 (internacional→país→área).
-- TECHO: internacional → país → equipo
-- Latir:  fundación → área
CREATE TABLE areas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_area_id   UUID REFERENCES areas(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  level            SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  responsable_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_areas_organization_id ON areas (organization_id);
CREATE INDEX idx_areas_parent_area_id ON areas (parent_area_id);

CREATE TRIGGER trg_areas_updated_at
BEFORE UPDATE ON areas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. FUNDING SOURCES — fuentes de financiamiento por proyecto
-- ============================================================
-- Un proyecto puede tener múltiples fuentes simultáneas.
-- Latir: 90% cooperación internacional + 10% donantes individuales.
CREATE TABLE funding_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  funder_type      funding_source_type NOT NULL DEFAULT 'other',
  amount           NUMERIC(20, 7) NOT NULL CHECK (amount > 0),
  asset_code       asset_code NOT NULL DEFAULT 'USDC',
  received_at      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_funding_sources_project_id ON funding_sources (project_id);
CREATE INDEX idx_funding_sources_organization_id ON funding_sources (organization_id);

-- ============================================================
-- 5. EXPENSE SPLITS — distribución de un gasto entre proyectos
-- ============================================================
-- TECHO: "5 viviendas de una empresa y 9 de otra → asignar porcentajes"
-- Cuando se usan splits, transactions.project_id queda NULL.
CREATE TABLE expense_splits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  funding_source_id UUID REFERENCES funding_sources(id) ON DELETE SET NULL,
  amount            NUMERIC(20, 7) NOT NULL CHECK (amount > 0),
  percentage        NUMERIC(5, 2) CHECK (percentage > 0 AND percentage <= 100),
  notes             TEXT,
  CONSTRAINT expense_splits_tx_proj_unique UNIQUE (transaction_id, project_id)
);

CREATE INDEX idx_expense_splits_transaction_id ON expense_splits (transaction_id);
CREATE INDEX idx_expense_splits_project_id ON expense_splits (project_id);

-- ============================================================
-- 6. PIPELINE TEMPLATES — plantillas de etapas a nivel de org
-- ============================================================
-- Una org define plantillas reutilizables de flujo.
-- Cada proyecto clona la plantilla que aplica.
CREATE TABLE pipeline_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  is_default       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_templates_org ON pipeline_templates (organization_id);

CREATE TRIGGER trg_pipeline_templates_updated_at
BEFORE UPDATE ON pipeline_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE pipeline_template_stages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID NOT NULL REFERENCES pipeline_templates(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  order_index      SMALLINT NOT NULL,
  notify_donor     BOOLEAN NOT NULL DEFAULT FALSE,
  notification_msg TEXT,
  CONSTRAINT pipeline_tpl_stage_order_unique UNIQUE (template_id, order_index)
);

CREATE INDEX idx_pipeline_tpl_stages_template ON pipeline_template_stages (template_id);

-- ============================================================
-- 7. PIPELINE STAGES — etapas propias de cada proyecto
-- ============================================================
-- Se crean clonando una plantilla o manualmente.
-- TECHO: "fondos recibidos → enviados al país → materiales → construcción"
CREATE TABLE pipeline_stages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_stage_id  UUID REFERENCES pipeline_template_stages(id) ON DELETE SET NULL,
  name               VARCHAR(100) NOT NULL,
  description        TEXT,
  order_index        SMALLINT NOT NULL,
  notify_donor       BOOLEAN NOT NULL DEFAULT FALSE,
  notification_msg   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pipeline_stages_order_unique UNIQUE (project_id, order_index)
);

CREATE INDEX idx_pipeline_stages_project ON pipeline_stages (project_id);

CREATE TABLE pipeline_transitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_stage_id    UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id      UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  transitioned_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_transitions_project ON pipeline_transitions (project_id);

-- ============================================================
-- 8. IMPACT INDICATORS — indicadores de impacto por proyecto
-- ============================================================
-- Entidad propia, independiente del movimiento financiero.
-- Latir: "familias atendidas", "alcance territorial", "resultados de mediano plazo"
CREATE TABLE impact_indicators (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  unit             VARCHAR(50) NOT NULL,
  target_value     NUMERIC(15, 4),
  actual_value     NUMERIC(15, 4),
  recorded_at      DATE NOT NULL,
  evidence_url     TEXT,
  recorded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_impact_indicators_project ON impact_indicators (project_id);
CREATE INDEX idx_impact_indicators_org ON impact_indicators (organization_id);

-- ============================================================
-- 9. BENEFICIARIES — beneficiarios reales con evidencia
-- ============================================================
-- Reemplaza estimación histórica con conteo real por proyecto.
-- TECHO + Latir: foto, fecha, descripción — diferenciador de producto.
CREATE TABLE beneficiaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  count            INTEGER NOT NULL CHECK (count > 0),
  description      TEXT,
  evidence_url     TEXT,
  recorded_at      DATE NOT NULL,
  recorded_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_beneficiaries_project ON beneficiaries (project_id);
CREATE INDEX idx_beneficiaries_org ON beneficiaries (organization_id);

-- ============================================================
-- 10. INVOICE OCR — pipeline de ingestión de facturas
-- ============================================================
-- Flujo: Responsable sube foto → OCR extrae campos → Contador valida → se vincula a Transaction.
-- Requisito transversal confirmado por Laura (ACAPS), Sergio (Wills Wilde), Ramiro (TECHO).
-- No se autoconfirma OCR sin validación humana (ACAPS lo indicó explícitamente).
CREATE TABLE invoice_ocr (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  image_url        TEXT NOT NULL,
  ocr_status       ocr_status NOT NULL DEFAULT 'pending',
  extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  ocr_raw          JSONB,
  validated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_ocr_transaction ON invoice_ocr (transaction_id);
CREATE INDEX idx_invoice_ocr_org ON invoice_ocr (organization_id);
CREATE INDEX idx_invoice_ocr_status ON invoice_ocr (ocr_status);

-- ============================================================
-- 11. REPORT TEMPLATES — motor de plantillas por donante
-- ============================================================
-- ACAPS: "para la UE hay un formato y para USAID otro... es casi personalizado"
CREATE TABLE report_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  format            template_format NOT NULL DEFAULT 'custom',
  description       TEXT,
  schema_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_templates_org ON report_templates (organization_id);

CREATE TRIGGER trg_report_templates_updated_at
BEFORE UPDATE ON report_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ALTERACIONES A TABLAS EXISTENTES
-- ============================================================

-- projects: vinculo a jerarquía plan→programa y pipeline actual
ALTER TABLE projects
  ADD COLUMN program_id      UUID REFERENCES programs(id) ON DELETE SET NULL,
  ADD COLUMN current_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_program_id ON projects (program_id);

-- accounts: vinculo a unidad organizacional
ALTER TABLE accounts
  ADD COLUMN area_id UUID REFERENCES areas(id) ON DELETE SET NULL;

CREATE INDEX idx_accounts_area_id ON accounts (area_id);

-- transactions: project_id nullable (split distribuye entre proyectos) + area + fuente de fondo
-- FUENTE DE VERDAD DEL ESTADO:
--   projects.status       = estado de ciclo de vida (admin controla: draft/active/paused/completed/archived)
--   projects.current_stage_id = estado de ejecución visible al donante (pipeline configurable)
--   Ambos coexisten con responsabilidades distintas.
ALTER TABLE transactions
  ALTER COLUMN project_id DROP NOT NULL,
  ADD COLUMN area_id          UUID REFERENCES areas(id) ON DELETE SET NULL,
  ADD COLUMN funding_source_id UUID REFERENCES funding_sources(id) ON DELETE SET NULL;
-- funding_source_id: para transacciones simples (sin split) registra la fuente directamente.
-- Para transacciones con split, la fuente va en expense_splits.funding_source_id.

CREATE INDEX idx_transactions_area_id ON transactions (area_id);
CREATE INDEX idx_transactions_funding_source ON transactions (funding_source_id);

-- reports: vinculo a template
ALTER TABLE reports
  ADD COLUMN template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL;

-- ============================================================
-- RLS — nuevas tablas heredan aislamiento por organization_id
-- ============================================================
ALTER TABLE plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_transitions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_ocr       ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates  ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_org_isolation ON plans
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY programs_org_isolation ON programs
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY areas_org_isolation ON areas
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY funding_sources_org_isolation ON funding_sources
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY expense_splits_select ON expense_splits
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE organization_id = app.current_organization_id()
    )
  );

CREATE POLICY expense_splits_write ON expense_splits
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM transactions WHERE organization_id = app.current_organization_id()
    )
  );

CREATE POLICY pipeline_templates_org_isolation ON pipeline_templates
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY pipeline_tpl_stages_select ON pipeline_template_stages
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM pipeline_templates WHERE organization_id = app.current_organization_id()
    )
  );

CREATE POLICY pipeline_stages_org_isolation ON pipeline_stages
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY pipeline_transitions_select ON pipeline_transitions
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = app.current_organization_id()
    )
  );

CREATE POLICY impact_indicators_org_isolation ON impact_indicators
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY beneficiaries_org_isolation ON beneficiaries
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY report_templates_org_isolation ON report_templates
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY invoice_ocr_org_isolation ON invoice_ocr
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

COMMIT;
