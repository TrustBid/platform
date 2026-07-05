'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FileText, Plus, ArrowRight, ArrowLeft, CheckCircle, Upload, Eye, BarChart2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useReports, type CreateReportInput } from '@/hooks/useReports';
import { BlockchainAnchorBadge } from '@/components/blockchain/BlockchainAnchorBadge';

const REPORT_TYPE_LABELS: Record<string, string> = {
  financial: 'Reporte Financiero',
  milestone: 'Verificación de Hito',
  audit: 'Auditoría Externa',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const EMPTY_FORM: CreateReportInput & { milestoneProgress?: number } = {
  projectId: '',
  reportType: '',
  title: '',
  description: '',
  periodStart: '',
  periodEnd: '',
  fundsUsedAsset: 'XLM',
};

export default function ReportsPage() {
  const { projects } = useProjects();
  const { reports, loading, createReport } = useReports();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos de número como string para inputs controlados.
  const [form, setForm] = useState({ ...EMPTY_FORM, fundsUsedAmount: '', milestoneProgress: '' });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const canSubmit =
    !!form.projectId && !!form.reportType && !!form.title.trim() && !!form.periodStart && !!form.periodEnd;

  const openForm = () => {
    setForm({ ...EMPTY_FORM, fundsUsedAmount: '', milestoneProgress: '' });
    setError(null);
    setCurrentStep(1);
    setIsFormOpen(true);
  };

  const handleCreateReport = async () => {
    if (!canSubmit) { setError('Completa proyecto, tipo, período y título.'); return; }
    setSubmitting(true);
    setError(null);
    const payload: CreateReportInput = {
      projectId: form.projectId,
      reportType: form.reportType,
      title: form.title.trim(),
      description: form.description || undefined,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      fundsUsedAmount: form.fundsUsedAmount ? Number(form.fundsUsedAmount) : undefined,
      fundsUsedAsset: form.fundsUsedAsset,
      milestoneProgress: form.milestoneProgress ? Number(form.milestoneProgress) : undefined,
    };
    const created = await createReport(payload);
    setSubmitting(false);
    if (created) {
      setIsFormOpen(false);
      setCurrentStep(1);
    } else {
      setError('No se pudo emitir el reporte. Verifica los datos e intenta de nuevo.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Reportes</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Audita hitos y estados financieros de tus proyectos</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors"
            onClick={openForm}
          >
            <Plus className="h-4 w-4" />
            Nuevo reporte
          </Button>
          <ModeToggle />
        </div>
      </div>

      {/* Lista / estado vacío */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : reports.length === 0 ? (
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 py-24 px-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <div className="p-4 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-500 dark:border-blue-900/30 rounded-2xl mb-5">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Aún no hay reportes</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 max-w-sm mt-1 mb-6">
            Crea tu primer reporte de hito o financiero para documentar el avance del proyecto
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            onClick={openForm}
          >
            Crear tu primer reporte
          </Button>
        </div>
      ) : (
        <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  {['Título', 'Proyecto', 'Tipo', 'Período', 'Estado', 'Blockchain'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-200/70 last:border-0 dark:border-zinc-800/60">
                    <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">{r.title}</td>
                    <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">{r.projectName}</td>
                    <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{REPORT_TYPE_LABELS[r.reportType] ?? r.reportType}</td>
                    <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{r.periodStart} → {r.periodEnd}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <BlockchainAnchorBadge
                        txHash={r.anchorTxHash}
                        status={r.blockchainStatus}
                        label=""
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* FORMULARIO MULTI-PASO */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full sm:max-w-4xl bg-[#fafafa] border border-zinc-200 text-zinc-950 max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-lg space-y-6">

          <div className="flex flex-col gap-1 text-left border-b border-zinc-200/60 pb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span>Crear Reporte</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Crear Reporte</h2>
            <p className="text-xs text-zinc-400">Paso {currentStep} de 4</p>
          </div>

          {/* STEPPER */}
          <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4 py-2">
            {[
              { step: 1, label: 'Informacion', icon: FileText },
              { step: 2, label: 'Datos', icon: BarChart2 },
              { step: 3, label: 'Documentos', icon: Upload },
              { step: 4, label: 'Revision', icon: CheckCircle },
            ].map((item, index, arr) => {
              const IconComponent = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <React.Fragment key={item.step}>
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                        : isCompleted
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'bg-white border-zinc-200 text-zinc-400'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-semibold tracking-tight transition-colors ${
                      isActive ? 'text-zinc-900 font-bold' : isCompleted ? 'text-blue-600' : 'text-zinc-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className={`h-[1px] flex-1 mx-4 transition-colors ${
                      currentStep > item.step ? 'bg-blue-300' : 'bg-zinc-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* PASOS */}
          <div className="pt-4">
            {currentStep === 1 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-zinc-100">
                  <CardTitle className="text-base font-bold text-zinc-900">Informacion del reporte</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Proyecto *</label>
                      <Select value={form.projectId} onValueChange={(v) => set({ projectId: v })}>
                        <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                          {projects.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-zinc-400">No tienes proyectos aún</div>
                          ) : (
                            projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Tipo de reporte *</label>
                      <Select value={form.reportType} onValueChange={(v) => set({ reportType: v })}>
                        <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                          <SelectItem value="financial">Reporte Financiero</SelectItem>
                          <SelectItem value="milestone">Verificación de Hito</SelectItem>
                          <SelectItem value="audit">Auditoría Externa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Periodo desde *</label>
                      <Input type="date" value={form.periodStart} onChange={(e) => set({ periodStart: e.target.value })} className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Periodo hasta *</label>
                      <Input type="date" value={form.periodEnd} onChange={(e) => set({ periodEnd: e.target.value })} className="border-zinc-300 bg-white text-zinc-900 h-9" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Titulo del reporte *</label>
                    <Input
                      placeholder="Ej. Reporte financiero Q1 2026"
                      value={form.title}
                      onChange={(e) => set({ title: e.target.value })}
                      className="border-zinc-300 bg-white text-zinc-900 h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Descripcion</label>
                    <Textarea
                      placeholder="Descripcion breve del reporte..."
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      className="border-zinc-300 bg-white text-zinc-900 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Métricas y Datos Financieros</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Montos ejecutados e hitos cubiertos en este ciclo</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Fondos Utilizados</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={form.fundsUsedAmount}
                          onChange={(e) => set({ fundsUsedAmount: e.target.value })}
                          className="border-zinc-300 bg-white text-zinc-900 h-9"
                        />
                        <Select value={form.fundsUsedAsset} onValueChange={(v) => set({ fundsUsedAsset: v })}>
                          <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="XLM">XLM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Porcentaje de avance hito (%)</label>
                      <Input
                        type="number"
                        placeholder="Ej. 25"
                        min={0}
                        max={100}
                        value={form.milestoneProgress}
                        onChange={(e) => set({ milestoneProgress: e.target.value })}
                        className="border-zinc-300 bg-white text-zinc-900 h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Documentación de Respaldo</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Próximamente: adjuntar facturas y comprobantes</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center flex flex-col items-center justify-center opacity-60">
                    <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-semibold text-zinc-800">Subida de archivos disponible próximamente</p>
                    <p className="text-xs text-zinc-400 mt-1">Por ahora puedes emitir el reporte sin adjuntos</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Revisión Final</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Verifica los datos antes de emitir</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-2 text-sm text-zinc-700">
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-2">
                    <p><strong>Título:</strong> {form.title || 'Sin título'}</p>
                    <p><strong>Proyecto:</strong> {projects.find((p) => p.id === form.projectId)?.name || '—'}</p>
                    <p><strong>Tipo:</strong> {REPORT_TYPE_LABELS[form.reportType] || '—'}</p>
                    <p><strong>Período:</strong> {form.periodStart || '—'} → {form.periodEnd || '—'}</p>
                    <p><strong>Fondos usados:</strong> {form.fundsUsedAmount ? `${form.fundsUsedAmount} ${form.fundsUsedAsset}` : '—'}</p>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 pt-1">
                      <Eye className="h-3.5 w-3.5" /> El reporte se guardará y quedará marcado como enviado.
                    </p>
                  </div>
                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                </CardContent>
              </Card>
            )}
          </div>

          {/* NAVEGACIÓN */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1}
              onClick={prevStep}
              className="border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-medium text-xs h-9 px-4 flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-5 flex items-center gap-1.5 shadow-sm"
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateReport}
                disabled={submitting || !canSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-5 shadow-sm disabled:opacity-60"
              >
                {submitting ? 'Emitiendo…' : 'Emitir Reporte'}
              </Button>
            )}
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}
