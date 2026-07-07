'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { OnboardingNameModal } from '@/components/shared/OnboardingNameModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useProjects } from '@/hooks/useProjects';
import { usePipeline } from '@/hooks/usePipeline';
import { useAlerts } from '@/hooks/useAlerts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { projects } = useProjects();

  // Onboarding Modal logic (keep existing behavior intact)
  const [displayName, setDisplayName] = useState<string | null>(null);
  const needsOnboarding = user !== null && /^Usuario [A-Za-z0-9]{8}/.test(user.name) && displayName === null;
  const handleNameSaved = useCallback((name: string) => setDisplayName(name), []);

  // Dropdown states
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState("Todo el año");

  const { metrics, loading: metricsLoading } = useDashboardMetrics({ projectId: selectedProjectId });
  const { activity, loading: activityLoading } = useRecentActivity();
  const { stages, loading: pipelineLoading } = usePipeline(selectedProjectId);
  const { alerts, alertCount } = useAlerts();

  const selectedProjectName = useMemo(
    () => projects.find((p) => p.id === selectedProjectId)?.name ?? 'Todos los proyectos',
    [projects, selectedProjectId],
  );

  const weeklyData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const filtered = selectedProjectId
      ? projects.filter((p) => p.id === selectedProjectId)
      : projects;

    filtered.forEach((p) => {
      const cat = p.category || 'Otros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + p.spentAmount;
    });

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        percentage: Math.round((value / totalSpent) * 100),
      }));
  }, [projects, selectedProjectId]);

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
              <span>{selectedProjectName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {projectOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedProjectId(undefined);
                    setProjectOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                    !selectedProjectId ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Todos los proyectos
                </button>
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setProjectOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      selectedProjectId === proj.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {proj.name}
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
                {["Todo el año", "Último mes", "Último trimestre"].map((dt) => (
                  <button
                    key={dt}
                    onClick={() => {
                      setSelectedDates(dt);
                      setDateOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      selectedDates === dt ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
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
            {metricsLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-800">${metrics.totalBudget.toLocaleString('en-US')}</div>
            )}
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
            {metricsLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-800">${metrics.totalSpent.toLocaleString('en-US')}</div>
            )}
            <div className="mt-1 space-y-1">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.executionPercentage}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium text-right">{metrics.executionPercentage}% del presupuesto</div>
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
            {metricsLoading ? (
              <Skeleton className="h-7 w-10 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-800">{metrics.pendingValidation}</div>
            )}
            <div className="text-xs text-slate-500 font-medium">reportes por validar</div>
          </div>
        </div>

        {/* Card 4: Anclado on-chain */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50/70 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 rounded-md bg-purple-600/20 border-2 border-purple-500" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Anclado on-chain</div>
            {metricsLoading ? (
              <Skeleton className="h-7 w-10 mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-800">{metrics.anchoredCount}</div>
            )}
            <div className="text-xs text-slate-500 font-medium">reportes verificados</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gastos por categoría (bar chart) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Gastos por categoría</h3>
            <p className="text-xs text-slate-400 font-medium">Distribución del gasto ejecutado por categoría</p>
          </div>

          <div className="flex gap-4 items-stretch mt-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 select-none pb-6 h-[180px] text-right w-8">
              {(() => {
                const maxVal = Math.max(...weeklyData.map((d) => d.value), 1);
                return Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>${Math.round(((5 - i) / 5) * maxVal).toLocaleString('en-US')}</span>
                ));
              })()}
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
              {weeklyData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                  {metricsLoading ? 'Cargando...' : 'Sin datos de gastos'}
                </div>
              ) : (
                weeklyData.map((d, index) => {
                  const maxVal = Math.max(...weeklyData.map((wd) => wd.value), 1);
                  const heightPct = Math.round((d.value / maxVal) * 100);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end relative group z-10">
                      <div className="absolute -top-7 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${d.value.toLocaleString('en-US')}
                      </div>
                      <div 
                        className="w-full max-w-[32px] rounded-t bg-blue-200/80 hover:bg-blue-300/90 transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-medium text-slate-400 mt-2 truncate max-w-[48px] text-center" title={d.label}>
                        {d.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Por categoría (donut) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Por categoría</h3>
            <p className="text-xs text-slate-400 font-medium">Distribución del gasto ejecutado</p>
          </div>

          <div className="flex items-center justify-center gap-8 py-4 flex-1 flex-col sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {weeklyData.map((d, i) => {
                  const colors = ['#2563eb', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
                  const total = weeklyData.reduce((a, b) => a + b.value, 0) || 1;
                  const prevSum = weeklyData.slice(0, i).reduce((a, b) => a + b.value, 0);
                  const dashLen = (d.value / total) * 251.2;
                  const dashOffset = -(prevSum / total) * 251.2;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={colors[i % colors.length]}
                      strokeWidth="12"
                      strokeDasharray={`${dashLen} 251.2`}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-800">100%</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2 text-xs flex-1">
              {weeklyData.map((d, i) => {
                const colors = ['bg-blue-600', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-cyan-500'];
                const total = weeklyData.reduce((a, b) => a + b.value, 0) || 1;
                return (
                  <div key={i} className={`flex items-center justify-between gap-4 ${i < weeklyData.length - 1 ? 'border-b border-slate-50 pb-1.5' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded ${colors[i % colors.length]} block shrink-0`} />
                      <span className="font-semibold text-slate-600">{d.label}</span>
                    </div>
                    <span className="font-bold text-slate-800">{Math.round((d.value / total) * 100)}%</span>
                  </div>
                );
              })}
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
            <p className="text-xs text-slate-400 font-medium">
              {selectedProjectId ? stages.length > 0 ? 'Etapas de ejecución' : 'Sin etapas configuradas' : 'Selecciona un proyecto'}
            </p>
          </div>

          <div className="relative pl-8 space-y-6 flex-1 py-1">
            {pipelineLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <Skeleton className="absolute -left-8 w-6 h-6 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))
            ) : !selectedProjectId ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-8">
                Selecciona un proyecto para ver su pipeline
              </div>
            ) : stages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-8">
                Sin etapas configuradas
              </div>
            ) : (
              <>
                {/* Connecting line */}
                <div className="absolute top-3 left-[11px] bottom-3 w-0.5 bg-slate-200 pointer-events-none" />
                {/* Completed line */}
                {(() => {
                  const currentIdx = stages.findIndex((s) => s.status === 'current');
                  const pct = currentIdx >= 0 ? Math.round((currentIdx / stages.length) * 100) : stages.every((s) => s.status === 'completed') ? 100 : 0;
                  return pct > 0 ? (
                    <div className="absolute top-3 left-[11px] w-0.5 bg-emerald-500 pointer-events-none transition-all duration-500" style={{ height: `${pct}%` }} />
                  ) : null;
                })()}

                {stages.map((stage, i) => {
                  const isCompleted = stage.status === 'completed';
                  const isCurrent = stage.status === 'current';
                  const selectedProject = projects.find((p) => p.id === selectedProjectId);
                  const showTxHash = isCompleted && i === 0 && selectedProject?.allocationTxHash;

                  return (
                    <div key={stage.id} className="relative flex items-start gap-4">
                      <div className={`absolute -left-8 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-100 border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                          {stage.name}
                        </div>
                        <div className={`text-xs ${isCurrent ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                          {isCompleted ? 'Completado' : isCurrent ? 'En curso' : 'Pendiente'}
                        </div>
                        {showTxHash && (
                          <div className="mt-1.5">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-100">
                              código: {selectedProject!.allocationTxHash!.slice(0, 8)}…
                            </span>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="mt-2 w-4/5">
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '45%' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide">Alertas</h3>
            {alertCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{alertCount}</span>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {alerts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-8">
                Sin alertas activas
              </div>
            ) : (
              alerts.map((alert) => {
                const borderCls = {
                  warning: 'border-amber-200 bg-amber-50/50',
                  error: 'border-red-200 bg-red-50/50',
                  info: 'border-purple-200 bg-purple-50/50',
                  success: 'border-emerald-200 bg-emerald-50/50',
                }[alert.severity];
                const textCls = {
                  warning: 'text-amber-700',
                  error: 'text-red-700',
                  info: 'text-purple-700',
                  success: 'text-emerald-700',
                }[alert.severity];
                const Icon = {
                  warning: AlertTriangle,
                  error: AlertCircle,
                  info: Clock,
                  success: Check,
                }[alert.severity];
                const timeAgo = getTimeAgo(alert.timestamp);

                return (
                  <div key={alert.id} className={`border ${borderCls} p-4 rounded-xl space-y-1`}>
                    <div className={`${textCls} text-xs font-bold flex items-center gap-1.5`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.title}</span>
                    </div>
                    <p className="text-slate-700 text-xs font-semibold">{alert.description}</p>
                    <div className="text-slate-400 text-[10px] font-medium pt-1">{timeAgo}</div>
                  </div>
                );
              })
            )}
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
            {activityLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-12 ml-auto" />
                    <Skeleton className="h-2.5 w-10 ml-auto" />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-8">
                Sin actividad reciente
              </div>
            ) : (
              activity.slice(0, 5).map((item, index) => {
                const isPositive = item.amount >= 0;
                const iconColor = item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-500' : item.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500';
                const Icon = item.status === 'confirmed' ? Check : item.status === 'pending' ? Clock : ArrowUpRight;
                const timeAgo = getTimeAgo(item.occurredAt);
                return (
                  <div key={item.id} className={`flex items-center justify-between py-2.5 ${index === 4 ? 'pt-2.5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{item.concept}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.projectName || 'General'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {isPositive ? '+' : '-'}${Math.abs(item.amount).toLocaleString('en-US')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{timeAgo}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `Hace ${diffD}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
