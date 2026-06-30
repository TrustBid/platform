import type { NgoInfo, Project } from '@/types/public';

/**
 * FUENTE PROVISIONAL DE DATOS — única y aislada.
 *
 * No hay backend todavía. La repository (`./repository.ts`) usa este seed SOLO mientras
 * `BACKEND_URL` no esté configurado. Cuando exista el backend, la repository lo consume y
 * este archivo deja de usarse — la UI no cambia (consume los endpoints / la repository).
 *
 * Nota: el primer movimiento usa un hash REAL de Stellar Testnet, por lo que su link a
 * Stellar Expert resuelve de verdad.
 */

export const NGO: NgoInfo = {
  name: 'Welcome Our TrustBid',
  tagline: 'Cada peso, trazable. Cada impacto, verificable.',
  mission:
    'Gestionamos fondos de donantes internacionales para proyectos sociales en Latinoamérica, con trazabilidad financiera verificable de forma independiente sobre la red Stellar.',
  totals: {
    projects: 3,
    raisedUsd: 412_000,
    spentUsd: 271_500,
    beneficiaries: 8_640,
  },
  fundUsage: [
    { category: 'Education', amountUsd: 96_000 },
    { category: 'Health', amountUsd: 78_500 },
    { category: 'Infrastructure', amountUsd: 61_000 },
    { category: 'Environment', amountUsd: 22_000 },
    { category: 'Operations', amountUsd: 14_000 },
  ],
};

export const PROJECTS: Project[] = [
  {
    id: 'escuela-san-pedro',
    name: 'Escuela San Pedro — Fase 1',
    category: 'Education',
    status: 'active',
    summary: 'Construcción y equipamiento de aulas para 320 niños en zona rural.',
    description:
      'Construcción de 6 aulas, sanitarios y biblioteca para la comunidad de San Pedro, más equipamiento y materiales para el ciclo lectivo. Beneficia directamente a 320 niños y a sus familias.',
    currency: 'USDC',
    budgetTotalUsd: 120_000,
    budgetSpentUsd: 78_400,
    beneficiariesTarget: 320,
    beneficiariesReached: 210,
    currentStage: 'Ejecución',
    pipeline: [
      { key: 'design', label: 'Diseño', date: '2026-01-15T00:00:00Z', status: 'done' },
      { key: 'funding', label: 'Fondeo', date: '2026-02-20T00:00:00Z', status: 'done' },
      { key: 'execution', label: 'Ejecución', date: '2026-04-01T00:00:00Z', status: 'current' },
      { key: 'verification', label: 'Verificación', date: null, status: 'pending' },
      { key: 'closure', label: 'Cierre', date: null, status: 'pending' },
    ],
    traceability: [
      {
        id: 'mov-1',
        date: '2026-04-12T14:00:00Z',
        concept: 'Materiales de construcción — Corralón San Pedro',
        amount: 18_500,
        currency: 'USDC',
        verificationCode: 'f30d32e02ad8f272f55f5d6baffe658ba37929c9e6028adb3b48bf5765bf7b5c',
        status: 'verified',
      },
      {
        id: 'mov-2',
        date: '2026-04-28T16:30:00Z',
        concept: 'Mano de obra — cuadrilla local (mes 1)',
        amount: 12_000,
        currency: 'USDC',
        verificationCode: 'b21a7c4d9e8f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293',
        status: 'verified',
      },
      {
        id: 'mov-3',
        date: '2026-05-30T11:00:00Z',
        concept: 'Mobiliario escolar (lote 1)',
        amount: 9_400,
        currency: 'USDC',
        verificationCode: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f907182',
        status: 'pending',
      },
    ],
    impact: [
      { label: 'Aulas construidas', target: 6, actual: 4, unit: 'aulas' },
      { label: 'Niños beneficiados', target: 320, actual: 210, unit: 'niños' },
      { label: 'Familias alcanzadas', target: 280, actual: 180, unit: 'familias' },
    ],
  },
  {
    id: 'agua-seguranca',
    name: 'Agua Segura — Comunidad Norte',
    category: 'Infrastructure',
    status: 'active',
    summary: 'Pozos y red de agua potable para 1.200 personas.',
    description:
      'Perforación de 3 pozos, tendido de red y tanques de almacenamiento para garantizar agua potable a la Comunidad Norte. Incluye capacitación para el mantenimiento local.',
    currency: 'USDC',
    budgetTotalUsd: 95_000,
    budgetSpentUsd: 71_300,
    beneficiariesTarget: 1_200,
    beneficiariesReached: 900,
    currentStage: 'Ejecución',
    pipeline: [
      { key: 'design', label: 'Diseño', date: '2025-11-10T00:00:00Z', status: 'done' },
      { key: 'funding', label: 'Fondeo', date: '2025-12-05T00:00:00Z', status: 'done' },
      { key: 'execution', label: 'Ejecución', date: '2026-01-20T00:00:00Z', status: 'current' },
      { key: 'verification', label: 'Verificación', date: null, status: 'pending' },
      { key: 'closure', label: 'Cierre', date: null, status: 'pending' },
    ],
    traceability: [
      {
        id: 'mov-1',
        date: '2026-02-18T10:00:00Z',
        concept: 'Perforación pozo #1',
        amount: 24_000,
        currency: 'USDC',
        verificationCode: 'd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3',
        status: 'verified',
      },
      {
        id: 'mov-2',
        date: '2026-03-22T13:45:00Z',
        concept: 'Tanques de almacenamiento (x4)',
        amount: 16_800,
        currency: 'USDC',
        verificationCode: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
        status: 'verified',
      },
    ],
    impact: [
      { label: 'Pozos perforados', target: 3, actual: 2, unit: 'pozos' },
      { label: 'Personas con agua', target: 1_200, actual: 900, unit: 'personas' },
    ],
  },
  {
    id: 'salud-movil',
    name: 'Salud Móvil — Brigadas',
    category: 'Health',
    status: 'completed',
    summary: 'Brigadas médicas móviles para 3 comunidades aisladas.',
    description:
      'Unidad médica móvil con atención primaria, vacunación y controles para comunidades sin acceso a centros de salud. Proyecto finalizado y verificado.',
    currency: 'USDC',
    budgetTotalUsd: 60_000,
    budgetSpentUsd: 60_000,
    beneficiariesTarget: 2_500,
    beneficiariesReached: 2_730,
    currentStage: 'Cierre',
    pipeline: [
      { key: 'design', label: 'Diseño', date: '2025-08-01T00:00:00Z', status: 'done' },
      { key: 'funding', label: 'Fondeo', date: '2025-08-20T00:00:00Z', status: 'done' },
      { key: 'execution', label: 'Ejecución', date: '2025-09-10T00:00:00Z', status: 'done' },
      { key: 'verification', label: 'Verificación', date: '2025-12-15T00:00:00Z', status: 'done' },
      { key: 'closure', label: 'Cierre', date: '2026-01-10T00:00:00Z', status: 'done' },
    ],
    traceability: [
      {
        id: 'mov-1',
        date: '2025-09-15T09:00:00Z',
        concept: 'Equipamiento médico móvil',
        amount: 34_000,
        currency: 'USDC',
        verificationCode: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        status: 'verified',
      },
      {
        id: 'mov-2',
        date: '2025-10-30T15:20:00Z',
        concept: 'Insumos y vacunas',
        amount: 26_000,
        currency: 'USDC',
        verificationCode: '0718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6',
        status: 'verified',
      },
    ],
    impact: [
      { label: 'Atenciones médicas', target: 2_500, actual: 2_730, unit: 'atenciones' },
      { label: 'Comunidades visitadas', target: 3, actual: 3, unit: 'comunidades' },
    ],
  },
];
