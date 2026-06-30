-- TrustBid — Demo seed (idempotent, safe to run multiple times)
-- Org: LATIR ONG · 3 proyectos activos · transacciones con tx_hash

BEGIN;

-- ── Organization ─────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, country, wallet_address, stellar_network, settings)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'LATIR ONG',
  'latir-ong',
  'CO',
  'GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU',
  'testnet',
  '{"tagline":"Transparencia que transforma comunidades","mission":"Conectamos donantes con proyectos verificables en Latinoamérica usando blockchain para garantizar que cada peso llegue a quien lo necesita."}'
)
ON CONFLICT (id) DO NOTHING;

-- ── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, organization_id, name, email, password_hash, role, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','María García','maria@latir.org','$seed$','admin',true),
  ('b1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','Carlos López','carlos@latir.org','$seed$','responsable',true)
ON CONFLICT (id) DO NOTHING;

-- ── Projects ─────────────────────────────────────────────────────────────────
INSERT INTO projects
  (id, organization_id, name, description, beneficiary, category, status,
   budget_amount, spent_amount, budget_asset, blockchain_enabled, start_date, end_date)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Escuela Comunitaria San Pedro',
    'Construcción y equipamiento de una escuela primaria para 120 niños en la comunidad de San Pedro, Nariño. Incluye 6 aulas, biblioteca, zona deportiva y paneles solares.',
    'Comunidad San Pedro',
    'education','active',
    85000,52000,'USDC',true,
    '2025-01-15','2025-10-30'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Acueducto Rural Fase 2',
    'Extensión de la red de agua potable a 3 veredas rurales del municipio de Tumaco, beneficiando a más de 400 familias que actualmente no tienen acceso a agua tratada.',
    'Veredas La Playa, El Tigre y Palmeras',
    'infrastructure','active',
    120000,38000,'USDC',true,
    '2025-03-01','2025-12-15'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Brigada de Salud Móvil',
    'Atención médica primaria, odontológica y psicosocial gratuita para 1.200 personas en comunidades de difícil acceso en el Pacífico colombiano.',
    'Comunidades Pacífico Nariñense',
    'health','active',
    45000,31500,'USDC',true,
    '2025-02-01','2025-08-31'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Pipeline stages ───────────────────────────────────────────────────────────
INSERT INTO pipeline_stages (id, organization_id, project_id, name, order_index)
VALUES
  -- Escuela
  ('f1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Diseño y permisos',1),
  ('f1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Fondeo',2),
  ('f1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Construcción',3),
  ('f1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Equipamiento',4),
  ('f1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Entrega',5),
  -- Acueducto
  ('f1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Estudio técnico',1),
  ('f1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Licitación',2),
  ('f1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Instalación de red',3),
  ('f1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Pruebas',4),
  ('f100000a-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Operación',5),
  -- Brigada
  ('f100000b-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Planificación',1),
  ('f100000c-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Brigada 1',2),
  ('f100000d-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Brigada 2',3),
  ('f100000e-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Cierre',4)
ON CONFLICT (id) DO NOTHING;

-- Set current stage per project
UPDATE projects SET current_stage_id = 'f1000000-0000-0000-0000-000000000003'
WHERE id = 'c1000000-0000-0000-0000-000000000001';
UPDATE projects SET current_stage_id = 'f1000000-0000-0000-0000-000000000008'
WHERE id = 'c1000000-0000-0000-0000-000000000002';
UPDATE projects SET current_stage_id = 'f100000c-0000-0000-0000-000000000012'
WHERE id = 'c1000000-0000-0000-0000-000000000003';

-- ── Pipeline transitions (completed stages) ───────────────────────────────────
INSERT INTO pipeline_transitions (id, project_id, to_stage_id, created_at)
VALUES
  ('91000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','2025-01-15 10:00:00+00'),
  ('91000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000002','2025-02-01 10:00:00+00'),
  ('91000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000006','2025-03-01 10:00:00+00'),
  ('91000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000007','2025-04-15 10:00:00+00'),
  ('91000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','f100000b-0000-0000-0000-000000000011','2025-02-01 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ── Funding sources ───────────────────────────────────────────────────────────
INSERT INTO funding_sources (id, organization_id, project_id, name, funder_type, amount, asset_code, received_at)
VALUES
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Banco Interamericano de Desarrollo','international_org',60000,'USDC','2025-01-20'),
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Donantes individuales','individual',25000,'USDC','2025-02-10'),
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Gobierno de Colombia','government',100000,'USDC','2025-03-05'),
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Corporación Empresarial Pacífico','corporate',20000,'USDC','2025-03-20'),
  ('d1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Global Health Fund','international_org',45000,'USDC','2025-01-30')
ON CONFLICT (id) DO NOTHING;

-- ── Beneficiaries ─────────────────────────────────────────────────────────────
INSERT INTO beneficiaries (id, organization_id, project_id, count, description, recorded_at)
VALUES
  ('e1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',120,'Niños matriculados','2025-03-01'),
  ('e1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',85,'Familias beneficiadas','2025-03-01'),
  ('e1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',418,'Familias con acceso a agua potable','2025-05-15'),
  ('e1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',1240,'Pacientes atendidos brigada 1 y 2','2025-05-01')
ON CONFLICT (id) DO NOTHING;

-- ── Impact indicators ─────────────────────────────────────────────────────────
INSERT INTO impact_indicators (id, organization_id, project_id, name, unit, target_value, actual_value, recorded_at)
VALUES
  ('51000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Aulas construidas','aulas',6,4,'2025-04-30'),
  ('51000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Niños beneficiados','niños',120,0,'2025-04-30'),
  ('51000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Km de tubería instalada','km',12,8,'2025-06-01'),
  ('51000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Familias con agua potable','familias',400,418,'2025-06-01'),
  ('51000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Pacientes atendidos','personas',1200,1240,'2025-05-01'),
  ('51000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','Consultas odontológicas','consultas',300,387,'2025-05-01')
ON CONFLICT (id) DO NOTHING;

-- ── Transactions (with Stellar testnet tx_hash) ───────────────────────────────
INSERT INTO transactions
  (id, organization_id, project_id, beneficiary, concept, category, amount, asset_code,
   memo_id, tx_hash, tx_status, confirmed_at)
VALUES
  ('61000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Proveedor Materiales S.A.','Materiales de construcción lote 1','construction',18000,'USDC','PAY-2025-0001',
   'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890','confirmed','2025-02-10 14:30:00+00'),

  ('61000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Constructora Andina Ltda.','Mano de obra — mes 1','labor',12000,'USDC','PAY-2025-0002',
   'b2c3d4e5f67890b2c3d4e5f67890b2c3d4e5f67890b2c3d4e5f67890b2c3d4e5','confirmed','2025-03-01 09:00:00+00'),

  ('61000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Constructora Andina Ltda.','Mano de obra — mes 2','labor',12000,'USDC','PAY-2025-0003',
   'c3d4e5f67890c3d4e5f67890c3d4e5f67890c3d4e5f67890c3d4e5f67890c3d4','confirmed','2025-04-01 09:00:00+00'),

  ('61000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'Equipo supervisor','Viáticos y transporte equipo técnico','transport',2000,'USDC','PAY-2025-0004',
   'd4e5f67890d4e5f67890d4e5f67890d4e5f67890d4e5f67890d4e5f67890d4e5','confirmed','2025-04-15 11:00:00+00'),

  ('61000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
   'Industrias Plásticas del Pacífico','Tuberías PVC y accesorios fase 2A','materials',22000,'USDC','PAY-2025-0005',
   'e5f67890e5f67890e5f67890e5f67890e5f67890e5f67890e5f67890e5f67890','confirmed','2025-05-10 10:00:00+00'),

  ('61000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
   'Cooperativa de Trabajo Tumaco','Mano de obra instalación red','labor',16000,'USDC','PAY-2025-0006',
   'f678901234567890f678901234567890f678901234567890f678901234567890','confirmed','2025-05-25 10:00:00+00'),

  ('61000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Distribuidora Médica del Sur','Medicamentos y suministros brigada 1','medical',8500,'USDC','PAY-2025-0007',
   'a7b8c9d0e1f23456a7b8c9d0e1f23456a7b8c9d0e1f23456a7b8c9d0e1f23456','confirmed','2025-03-15 08:00:00+00'),

  ('61000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Personal médico voluntario','Honorarios equipo médico brigada 1','labor',14000,'USDC','PAY-2025-0008',
   'b8c9d0e1f234567b8c9d0e1f234567b8c9d0e1f234567b8c9d0e1f234567b8c9','confirmed','2025-03-30 16:00:00+00'),

  ('61000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Empresa de Transporte Fluvial','Transporte fluvial y logística','transport',9000,'USDC','PAY-2025-0009',
   'c9d0e1f23456789c9d0e1f23456789c9d0e1f23456789c9d0e1f23456789c9d0','confirmed','2025-04-10 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

COMMIT;
