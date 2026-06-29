-- TrustBid — Schema PostgreSQL (Sprint 1 + Sprint 2, F01–F11)
-- Base de datos: trustbid
-- Usuario: postgres
-- PostgreSQL 16+
--
-- Uso:
--   docker cp scripts/init-db.sql trustbid_postgres:/tmp/init-db.sql
--   docker exec -it trustbid_postgres psql -U postgres -d trustbid -f /tmp/init-db.sql
--
-- Requiere base de datos vacía (sin tablas previas en public).

BEGIN;

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- TIPOS ENUM
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'responsable', 'donante');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE project_category AS ENUM (
  'infrastructure', 'education', 'health', 'technology',
  'environment', 'social', 'other'
);
CREATE TYPE asset_code AS ENUM ('XLM', 'USDC');
CREATE TYPE tx_status AS ENUM ('pending', 'submitted', 'confirmed', 'failed');
CREATE TYPE report_type AS ENUM ('financial', 'milestone', 'audit');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE activity_type AS ENUM ('verification', 'disbursement', 'expense', 'report', 'project');
CREATE TYPE wallet_provider AS ENUM ('freighter', 'albedo', 'custodial');

-- ============================================================
-- HELPERS (updated_at + RLS sin Supabase)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app.current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. ORGANIZATIONS (F01, F04)
-- ============================================================
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  country         CHAR(2) NOT NULL,
  wallet_address  VARCHAR(56),
  stellar_network VARCHAR(20) NOT NULL DEFAULT 'testnet',
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organizations_slug_unique UNIQUE (slug),
  CONSTRAINT organizations_country_chk CHECK (country ~ '^[A-Z]{2}$')
);

CREATE INDEX idx_organizations_slug ON organizations (slug);
CREATE INDEX idx_organizations_country ON organizations (country);

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. USERS (F01, F02)
-- ============================================================
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            CITEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  name             VARCHAR(255) NOT NULL,
  phone            VARCHAR(30),
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'admin',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_org_email_unique UNIQUE (organization_id, email)
);

CREATE INDEX idx_users_organization_id ON users (organization_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. USER WALLETS (F04, Settings — Freighter)
-- ============================================================
CREATE TABLE user_wallets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         wallet_provider NOT NULL DEFAULT 'freighter',
  public_key       VARCHAR(56) NOT NULL,
  is_primary       BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disconnected_at  TIMESTAMPTZ,
  CONSTRAINT user_wallets_public_key_chk CHECK (public_key ~ '^G[A-Z2-7]{55}$')
);

CREATE UNIQUE INDEX idx_user_wallets_one_primary
  ON user_wallets (user_id)
  WHERE is_primary = TRUE AND disconnected_at IS NULL;

CREATE INDEX idx_user_wallets_org ON user_wallets (organization_id);
CREATE INDEX idx_user_wallets_public_key ON user_wallets (public_key);

-- ============================================================
-- 4. PROJECTS (F05, F03 dashboard)
-- ============================================================
CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  beneficiary         VARCHAR(255),
  category            project_category NOT NULL DEFAULT 'other',
  status              project_status NOT NULL DEFAULT 'draft',
  budget_amount       NUMERIC(20, 7) NOT NULL DEFAULT 0,
  budget_asset        asset_code NOT NULL DEFAULT 'XLM',
  budget_usd_estimate NUMERIC(15, 2),
  spent_amount        NUMERIC(20, 7) NOT NULL DEFAULT 0,
  start_date          DATE,
  end_date            DATE,
  blockchain_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  stellar_contract_id VARCHAR(64),
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projects_dates_chk CHECK (
    start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  ),
  CONSTRAINT projects_budget_nonneg CHECK (budget_amount >= 0),
  CONSTRAINT projects_spent_nonneg CHECK (spent_amount >= 0)
);

CREATE INDEX idx_projects_organization_id ON projects (organization_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_category ON projects (category);
CREATE INDEX idx_projects_created_at ON projects (created_at DESC);

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. ACCOUNTS — cuentas por area (F06)
-- ============================================================
CREATE TABLE accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  wallet_address   VARCHAR(56) NOT NULL,
  budget_amount    NUMERIC(20, 7) NOT NULL DEFAULT 0,
  spent_amount     NUMERIC(20, 7) NOT NULL DEFAULT 0,
  asset_code       asset_code NOT NULL DEFAULT 'USDC',
  categories       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT accounts_budget_nonneg CHECK (budget_amount >= 0),
  CONSTRAINT accounts_spent_nonneg CHECK (spent_amount >= 0)
);

CREATE INDEX idx_accounts_organization_id ON accounts (organization_id);
CREATE INDEX idx_accounts_project_id ON accounts (project_id);

CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. TRANSACTIONS — pagos/gastos (F07, F08, F10)
-- ============================================================
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  account_id          UUID REFERENCES accounts(id) ON DELETE SET NULL,
  beneficiary         VARCHAR(255) NOT NULL,
  concept             VARCHAR(120) NOT NULL,
  category            VARCHAR(100) NOT NULL,
  amount              NUMERIC(20, 7) NOT NULL,
  asset_code          asset_code NOT NULL DEFAULT 'USDC',
  memo_id             VARCHAR(20) NOT NULL,
  tx_hash             VARCHAR(64),
  tx_status           tx_status NOT NULL DEFAULT 'pending',
  stellar_ledger      BIGINT,
  support_file_path   VARCHAR(500),
  support_file_hash   VARCHAR(64),
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at        TIMESTAMPTZ,
  CONSTRAINT transactions_memo_unique UNIQUE (memo_id),
  CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  CONSTRAINT transactions_memo_format_chk CHECK (memo_id ~ '^PAY-[0-9]{4}-[0-9]{4}$')
);

CREATE INDEX idx_transactions_organization_id ON transactions (organization_id);
CREATE INDEX idx_transactions_project_id ON transactions (project_id);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_status ON transactions (tx_status);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions (tx_hash) WHERE tx_hash IS NOT NULL;

-- ============================================================
-- 7. REPORTS (F09)
-- ============================================================
CREATE TABLE reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_type         report_type NOT NULL,
  status              report_status NOT NULL DEFAULT 'draft',
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  funds_used_amount   NUMERIC(20, 7) NOT NULL DEFAULT 0,
  funds_used_asset    asset_code NOT NULL DEFAULT 'XLM',
  milestone_progress  NUMERIC(5, 2),
  submitted_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reports_period_chk CHECK (period_start <= period_end),
  CONSTRAINT reports_progress_chk CHECK (
    milestone_progress IS NULL OR (milestone_progress >= 0 AND milestone_progress <= 100)
  )
);

CREATE INDEX idx_reports_organization_id ON reports (organization_id);
CREATE INDEX idx_reports_project_id ON reports (project_id);
CREATE INDEX idx_reports_type ON reports (report_type);
CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_period ON reports (period_start, period_end);

CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. REPORT ATTACHMENTS (F09 paso 3)
-- ============================================================
CREATE TABLE report_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  file_hash       VARCHAR(64),
  mime_type       VARCHAR(100),
  size_bytes      BIGINT,
  uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_attachments_report_id ON report_attachments (report_id);
CREATE INDEX idx_report_attachments_org_id ON report_attachments (organization_id);

-- ============================================================
-- 9. ACTIVITY EVENTS (F03, F10 — feed del dashboard)
-- ============================================================
CREATE TABLE activity_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_type       activity_type NOT NULL,
  description      TEXT NOT NULL,
  tx_hash          VARCHAR(64),
  reference_table  VARCHAR(50),
  reference_id     UUID,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_events_org_created
  ON activity_events (organization_id, created_at DESC);
CREATE INDEX idx_activity_events_project_id ON activity_events (project_id);
CREATE INDEX idx_activity_events_type ON activity_events (event_type);

-- ============================================================
-- 10. CUSTODIAN KEYS — AWS KMS (F11)
-- ============================================================
CREATE TABLE custodian_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id       UUID REFERENCES accounts(id) ON DELETE CASCADE,
  public_key       VARCHAR(56) NOT NULL,
  kms_key_id       VARCHAR(255) NOT NULL,
  kms_key_version  VARCHAR(50),
  key_type         VARCHAR(50) NOT NULL DEFAULT 'ed25519',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT custodian_keys_account_unique UNIQUE (account_id)
);

CREATE INDEX idx_custodian_keys_org ON custodian_keys (organization_id);
CREATE INDEX idx_custodian_keys_public_key ON custodian_keys (public_key);

-- ============================================================
-- 11. INDEXER STATE (F10)
-- ============================================================
CREATE TABLE indexer_state (
  id            SMALLINT PRIMARY KEY,
  last_ledger   BIGINT NOT NULL DEFAULT 0,
  last_sync     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(50) NOT NULL DEFAULT 'idle',
  error_message TEXT
);

INSERT INTO indexer_state (id, last_ledger, last_sync, status)
VALUES (1, 0, CURRENT_TIMESTAMP, 'idle')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. ROW LEVEL SECURITY (multi-tenant por organizacion)
-- Backend debe ejecutar por request:
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.current_organization_id = '<uuid>';
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custodian_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select ON organizations
  FOR SELECT USING (id = app.current_organization_id());

CREATE POLICY org_update ON organizations
  FOR UPDATE USING (id = app.current_organization_id());

CREATE POLICY users_org_isolation ON users
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY user_wallets_org_isolation ON user_wallets
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY projects_org_isolation ON projects
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY accounts_org_isolation ON accounts
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY transactions_org_isolation ON transactions
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY reports_org_isolation ON reports
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY report_attachments_org_isolation ON report_attachments
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY activity_events_org_isolation ON activity_events
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY custodian_keys_org_isolation ON custodian_keys
  FOR ALL USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

COMMIT;
