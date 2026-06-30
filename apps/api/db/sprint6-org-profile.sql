-- Sprint 6: Extended organization profile
-- Run on Neon after sprint5-wallet-auth.sql

BEGIN;

-- ============================================================
-- LOOKUP TABLES (public, no RLS)
-- ============================================================

CREATE TABLE intervention_areas (
  id       SMALLSERIAL PRIMARY KEY,
  slug     VARCHAR(50)  NOT NULL UNIQUE,
  name_es  VARCHAR(100) NOT NULL,
  name_en  VARCHAR(100) NOT NULL
);

INSERT INTO intervention_areas (slug, name_es, name_en) VALUES
  ('education',        'Educación',                   'Education'),
  ('health',           'Salud y bienestar',            'Health & Well-being'),
  ('environment',      'Medio ambiente',               'Environment'),
  ('economic_dev',     'Desarrollo económico',         'Economic Development'),
  ('human_rights',     'Derechos humanos',             'Human Rights'),
  ('housing',          'Vivienda',                     'Housing'),
  ('food_security',    'Seguridad alimentaria',        'Food Security'),
  ('water_sanitation', 'Agua y saneamiento',           'Water & Sanitation'),
  ('gender_equality',  'Género e igualdad',            'Gender Equality'),
  ('youth',            'Niñez y juventud',             'Children & Youth'),
  ('elderly',          'Adulto mayor',                 'Elderly'),
  ('disability',       'Discapacidad',                 'Disability'),
  ('migration',        'Migración y refugio',          'Migration & Refugees'),
  ('culture',          'Cultura y patrimonio',         'Culture & Heritage'),
  ('technology',       'Tecnología e innovación',      'Technology & Innovation'),
  ('governance',       'Transparencia y gobernanza',   'Transparency & Governance');

CREATE TABLE target_populations (
  id       SMALLSERIAL PRIMARY KEY,
  slug     VARCHAR(50)  NOT NULL UNIQUE,
  name_es  VARCHAR(100) NOT NULL,
  name_en  VARCHAR(100) NOT NULL
);

INSERT INTO target_populations (slug, name_es, name_en) VALUES
  ('children',    'Niños y niñas (0–12)',           'Children (0–12)'),
  ('adolescents', 'Adolescentes (13–17)',            'Adolescents (13–17)'),
  ('youth',       'Jóvenes (18–29)',                 'Youth (18–29)'),
  ('adults',      'Adultos (30–59)',                 'Adults (30–59)'),
  ('elderly',     'Adultos mayores (60+)',           'Elderly (60+)'),
  ('women',       'Mujeres',                        'Women'),
  ('lgbtiq',      'Población LGBTIQ+',              'LGBTIQ+ Population'),
  ('disability',  'Personas con discapacidad',      'Persons with Disabilities'),
  ('indigenous',  'Comunidades indígenas',          'Indigenous Communities'),
  ('migrants',    'Migrantes y refugiados',         'Migrants & Refugees'),
  ('homeless',    'Personas en situación de calle', 'Homeless'),
  ('rural',       'Población rural',                'Rural Population'),
  ('urban_vuln',  'Población urbana vulnerable',    'Urban Vulnerable Population');

CREATE TABLE ods_goals (
  id       SMALLINT    PRIMARY KEY,
  name_es  VARCHAR(150) NOT NULL,
  name_en  VARCHAR(150) NOT NULL,
  color    CHAR(7)      NOT NULL
);

INSERT INTO ods_goals (id, name_es, name_en, color) VALUES
  (1,  'Fin de la pobreza',                         'No Poverty',                                  '#E5243B'),
  (2,  'Hambre cero',                               'Zero Hunger',                                 '#DDA63A'),
  (3,  'Salud y bienestar',                         'Good Health and Well-being',                  '#4C9F38'),
  (4,  'Educación de calidad',                      'Quality Education',                           '#C5192D'),
  (5,  'Igualdad de género',                        'Gender Equality',                             '#FF3A21'),
  (6,  'Agua limpia y saneamiento',                 'Clean Water and Sanitation',                  '#26BDE2'),
  (7,  'Energía asequible y no contaminante',       'Affordable and Clean Energy',                 '#FCC30B'),
  (8,  'Trabajo decente y crecimiento económico',   'Decent Work and Economic Growth',             '#A21942'),
  (9,  'Industria, innovación e infraestructura',   'Industry, Innovation and Infrastructure',     '#FD6925'),
  (10, 'Reducción de las desigualdades',            'Reduced Inequalities',                        '#DD1367'),
  (11, 'Ciudades y comunidades sostenibles',        'Sustainable Cities and Communities',          '#FD9D24'),
  (12, 'Producción y consumo responsables',         'Responsible Consumption and Production',      '#BF8B2E'),
  (13, 'Acción por el clima',                       'Climate Action',                              '#3F7E44'),
  (14, 'Vida submarina',                            'Life Below Water',                            '#0A97D9'),
  (15, 'Vida de ecosistemas terrestres',            'Life on Land',                                '#56C02B'),
  (16, 'Paz, justicia e instituciones sólidas',     'Peace, Justice and Strong Institutions',      '#00689D'),
  (17, 'Alianzas para lograr los objetivos',        'Partnerships for the Goals',                  '#19486A');

-- ============================================================
-- JOIN TABLES (org-scoped)
-- ============================================================

CREATE TABLE org_intervention_areas (
  organization_id UUID     NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  area_id         SMALLINT NOT NULL REFERENCES intervention_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, area_id)
);
CREATE INDEX idx_org_areas_org ON org_intervention_areas (organization_id);

CREATE TABLE org_target_populations (
  organization_id UUID     NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  population_id   SMALLINT NOT NULL REFERENCES target_populations(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, population_id)
);
CREATE INDEX idx_org_pops_org ON org_target_populations (organization_id);

CREATE TABLE org_ods_goals (
  organization_id UUID     NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ods_id          SMALLINT NOT NULL REFERENCES ods_goals(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, ods_id)
);
CREATE INDEX idx_org_ods_org ON org_ods_goals (organization_id);

-- ============================================================
-- EXTEND organizations TABLE
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN legal_name           VARCHAR(255),
  ADD COLUMN acronym              VARCHAR(30),
  ADD COLUMN fiscal_id            VARCHAR(100),
  ADD COLUMN org_type             VARCHAR(50),
  ADD COLUMN address_1            TEXT,
  ADD COLUMN address_2            TEXT,
  ADD COLUMN state_province       VARCHAR(100),
  ADD COLUMN postal_code          VARCHAR(20),
  ADD COLUMN phone                VARCHAR(30),
  ADD COLUMN website              TEXT,
  ADD COLUMN social_instagram     TEXT,
  ADD COLUMN social_linkedin      TEXT,
  ADD COLUMN social_x             TEXT,
  ADD COLUMN social_facebook      TEXT,
  ADD COLUMN geographic_scope     VARCHAR(30),
  ADD COLUMN annual_budget_range  VARCHAR(50),
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- RLS for join tables
-- ============================================================

ALTER TABLE org_intervention_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_target_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_ods_goals          ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_areas_isolation ON org_intervention_areas
  FOR ALL
  USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY org_pops_isolation ON org_target_populations
  FOR ALL
  USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

CREATE POLICY org_ods_isolation ON org_ods_goals
  FOR ALL
  USING (organization_id = app.current_organization_id())
  WITH CHECK (organization_id = app.current_organization_id());

COMMIT;
