'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  AlertTriangle, 
  ArrowUpRight, 
  ChevronDown, 
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { OnboardingNameModal } from '@/components/shared/OnboardingNameModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  // Onboarding Modal logic (keep existing behavior intact)
  const [displayName, setDisplayName] = useState<string | null>(null);
  const needsOnboarding = user !== null && /^Usuario [A-Za-z0-9]{8}/.test(user.name) && displayName === null;
  const handleNameSaved = useCallback((name: string) => setDisplayName(name), []);

  // Dropdown states
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("Escuela San Pedro — Fase 1");
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState("Jun 2026 - Jul 2026");

  const projectsList = [
    "Escuela San Pedro — Fase 1",
    "Construcción Aula Multiuso",
    "Programa de Becas 2026"
  ];

  const datesList = [
    "Jun 2026 - Jul 2026",
    "Ene 2026 - Jun 2026",
    "Todo el año"
  ];

  const weeklyData = [
    { label: 'S1', value: 1200, height: '30%', highlighted: false },
    { label: 'S2', value: 2800, height: '70%', highlighted: false },
    { label: 'S3', value: 1500, height: '37.5%', highlighted: false },
    { label: 'S4', value: 3100, height: '77.5%', highlighted: false },
    { label: 'S5', value: 2100, height: '52.5%', highlighted: false },
    { label: 'S6', value: 3200, height: '87.5%', highlighted: true, displayValue: '$3,200' },
    { label: 'S7', value: 1900, height: '47.5%', highlighted: false },
    { label: 'S8', value: 2700, height: '67.5%', highlighted: false },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 md:p-8 space-y-6 antialiased">
      {needsOnboarding && <OnboardingNameModal onSaved={handleNameSaved} />}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <button
              onClick={() => setProjectOpen(!projectOpen)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-4 py-2 flex items-center text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer gap-2"
            >
              <span className="w-4 h-2.5 rounded bg-blue-600 inline-block shrink-0" />
              <span>{selectedProject}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {projectOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                {projectsList.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      setSelectedProject(proj);
                      setProjectOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {proj}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Selector */}
          <div className="relative">
            <button
              onClick={() => setDateOpen(!dateOpen)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-4 py-2 flex items-center text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer gap-2"
            >
              <span>{selectedDates}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {dateOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                {datesList.map((dt) => (
                  <button
                    key={dt}
                    onClick={() => {
                      setSelectedDates(dt);
                      setDateOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {dt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Presupuesto total */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50/70 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 rounded-md bg-blue-600/20 border-2 border-blue-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Presupuesto total</div>
            <div className="text-2xl font-bold text-slate-800">$25,000</div>
            <div className="text-xs text-slate-500 font-medium">fondos aprobados</div>
          </div>
        </div>

        {/* Card 2: Total ejecutado */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50/70 flex items-center justify-center shrink-0 text-emerald-600">
            <Check className="w-5 h-5 stroke-[3px]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total ejecutado</div>
            <div className="text-2xl font-bold text-slate-800">$18,200</div>
            <div className="mt-1 space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium text-right">72% del presupuesto</div>
            </div>
          </div>
        </div>

        {/* Card 3: Pendiente validar */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50/70 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 rounded bg-amber-500/20 border-2 border-amber-500" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendiente validar</div>
            <div className="text-2xl font-bold text-slate-800">3</div>
            <div className="text-xs text-slate-500 font-medium">facturas por revisar</div>
          </div>
        </div>

        {/* Card 4: Anclado on-chain */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50/70 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 rounded-md bg-purple-600/20 border-2 border-purple-500" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Anclado on-chain</div>
            <div className="text-2xl font-bold text-slate-800">47</div>
            <div className="text-xs text-slate-500 font-medium">códigos de verificación</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gastos por semana */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Gastos por semana</h3>
            <p className="text-xs text-slate-400 font-medium">Monto ejecutado por semana (USDC)</p>
          </div>

          <div className="flex gap-4 items-stretch mt-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 select-none pb-6 h-[180px] text-right w-8">
              <span>4,000</span>
              <span>3,000</span>
              <span>2,000</span>
              <span>1,000</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="relative flex-1 h-[180px] flex items-end justify-between gap-2.5 md:gap-4 pb-1">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5">
                <div className="w-full border-t border-slate-100 h-0" />
                <div className="w-full border-t border-slate-100 h-0" />
                <div className="w-full border-t border-slate-100 h-0" />
                <div className="w-full border-t border-slate-100 h-0" />
                <div className="w-full border-b border-slate-200 h-0" />
              </div>
              
              {/* Bars */}
              {weeklyData.map((d, index) => (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end relative group z-10">
                  {d.highlighted && (
                    <div className="absolute -top-7 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-20">
                      {d.displayValue}
                    </div>
                  )}
                  <div 
                    className={`w-full max-w-[32px] rounded-t transition-all duration-300 ${
                      d.highlighted 
                        ? 'bg-blue-600' 
                        : 'bg-blue-200/80 hover:bg-blue-300/90'
                    }`}
                    style={{ height: d.height }}
                  />
                  <span className="text-[10px] font-medium text-slate-400 mt-2">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Por categoría */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Por categoría</h3>
            <p className="text-xs text-slate-400 font-medium">Distribución del gasto ejecutado</p>
          </div>

          <div className="flex items-center justify-center gap-8 py-4 flex-1 flex-col sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              {/* SVG Donut Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {/* Segment 1: Construcción (45%) -> Stroke-dasharray: 45 * 2.512 = 113.04 */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#2563eb" 
                  strokeWidth="12" 
                  strokeDasharray="113.04 251.2" 
                  strokeDashoffset="0"
                />
                {/* Segment 2: Materiales (28%) -> Stroke-dasharray: 28 * 2.512 = 70.34 */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#a855f7" 
                  strokeWidth="12" 
                  strokeDasharray="70.34 251.2" 
                  strokeDashoffset="-113.04"
                />
                {/* Segment 3: Personal (18%) -> Stroke-dasharray: 18 * 2.512 = 45.22 */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#10b981" 
                  strokeWidth="12" 
                  strokeDasharray="45.22 251.2" 
                  strokeDashoffset="-183.38"
                />
                {/* Segment 4: Otros (9%) -> Stroke-dasharray: 9 * 2.512 = 22.61 */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#f59e0b" 
                  strokeWidth="12" 
                  strokeDasharray="22.61 251.2" 
                  strokeDashoffset="-228.6"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-800">100%</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600 block shrink-0" />
                  <span className="font-semibold text-slate-600">Construcción</span>
                </div>
                <span className="font-bold text-slate-800">45%</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500 block shrink-0" />
                  <span className="font-semibold text-slate-600">Materiales</span>
                </div>
                <span className="font-bold text-slate-800">28%</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 block shrink-0" />
                  <span className="font-semibold text-slate-600">Personal</span>
                </div>
                <span className="font-bold text-slate-800">18%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 block shrink-0" />
                  <span className="font-semibold text-slate-600">Otros</span>
                </div>
                <span className="font-bold text-slate-800">9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pipeline, Alerts, Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline del proyecto */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Pipeline del proyecto</h3>
            <p className="text-xs text-slate-400 font-medium">Etapas de ejecución</p>
          </div>

          <div className="relative pl-8 space-y-6 flex-1 py-1">
            {/* Connecting line */}
            <div className="absolute top-3 left-[11px] bottom-3 w-0.5 bg-slate-200 pointer-events-none" />
            {/* Sub-lines for completed steps */}
            <div className="absolute top-3 left-[11px] h-[55%] w-0.5 bg-emerald-500 pointer-events-none" />

            {/* Step 1 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center text-white z-10">
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">Planificación</div>
                <div className="text-xs text-slate-400">10 Feb 2026</div>
                <div className="mt-1.5">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-100">
                    código: VRF-001
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center text-white z-10">
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">Fondeo</div>
                <div className="text-xs text-slate-400">22 Feb 2026</div>
                <div className="mt-1.5">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-100">
                    código: VRF-008
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-blue-600 border-2 border-blue-600 flex items-center justify-center text-white z-10 text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-sm">Ejecución</div>
                <div className="text-xs text-blue-600 font-semibold">En curso</div>
                <div className="mt-2 w-4/5">
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-400 z-10 text-xs font-bold">
                4
              </div>
              <div>
                <div className="font-semibold text-slate-400 text-sm">Verificación</div>
                <div className="text-xs text-slate-400">—</div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-400 z-10 text-xs font-bold">
                5
              </div>
              <div>
                <div className="font-semibold text-slate-400 text-sm">Cierre y reporte</div>
                <div className="text-xs text-slate-400">—</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Alertas</h3>
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">3</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {/* Alert 1 */}
            <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-xl space-y-1">
              <div className="text-amber-700 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Facturas sin validar</span>
              </div>
              <p className="text-slate-700 text-xs font-semibold">3 facturas esperan revisión</p>
              <div className="text-slate-400 text-[10px] font-medium pt-1">Hace 2h</div>
            </div>

            {/* Alert 2 */}
            <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl space-y-1">
              <div className="text-red-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Desembolso demorado</span>
              </div>
              <p className="text-slate-700 text-xs font-semibold">Pago a Ferretería Central sin anclar (&gt;24h)</p>
              <div className="text-slate-400 text-[10px] font-medium pt-1">Hace 26h</div>
            </div>

            {/* Alert 3 */}
            <div className="border border-purple-200 bg-purple-50/50 p-4 rounded-xl space-y-1">
              <div className="text-purple-700 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Gasto inusual detectado</span>
              </div>
              <p className="text-slate-700 text-xs font-semibold">Gasto en &quot;Otros&quot; +42% vs. semana anterior</p>
              <div className="text-slate-400 text-[10px] font-medium pt-1">Hace 3h</div>
            </div>

            {/* Alert 4 */}
            <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-xl space-y-1">
              <div className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[3px]" />
                <span>Etapa anclada</span>
              </div>
              <p className="text-slate-700 text-xs font-semibold">Fondeo confirmado on-chain — VRF-008</p>
              <div className="text-slate-400 text-[10px] font-medium pt-1">Hace 1 día</div>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Actividad reciente</h3>
            </div>
            <button
              onClick={() => router.push('/dashboard/reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver todo</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-between">
            {/* Actividad 1 */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                  <Check className="w-4 h-4 stroke-[3px]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Factura validada</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Contador · Luisa M.</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-600">-$3,200</div>
                <div className="text-[10px] text-slate-400 font-medium">Hace 1h</div>
              </div>
            </div>

            {/* Actividad 2 */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Desembolso enviado</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Admin · Carlos R.</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-blue-600">-$1,800</div>
                <div className="text-[10px] text-slate-400 font-medium">Hace 3h</div>
              </div>
            </div>

            {/* Actividad 3 */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Factura subida (OCR)</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Responsable · Ana T.</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-purple-600">$4,500</div>
                <div className="text-[10px] text-slate-400 font-medium">Hace 5h</div>
              </div>
            </div>

            {/* Actividad 4 */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Anclado on-chain</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Sistema</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">VRF-047</div>
                <div className="text-[10px] text-slate-400 font-medium">Hace 6h</div>
              </div>
            </div>

            {/* Actividad 5 */}
            <div className="flex items-center justify-between pt-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Desembolso enviado</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Admin · Carlos R.</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-blue-600">-$2,600</div>
                <div className="text-[10px] text-slate-400 font-medium">Ayer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
