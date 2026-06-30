'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FolderOpen, Plus, Layers, CheckCircle2, Clock } from 'lucide-react';
import { useProjects, type CreateProjectInput } from '@/hooks/useProjects';

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: 'Infraestructura',
  education: 'Educación',
  health: 'Salud',
  technology: 'Tecnología',
  environment: 'Medio ambiente',
  social: 'Social',
  other: 'Otro',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-zinc-100 text-zinc-600' },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, loading, error, createProject } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setIsFormOpen(true);
  }, [searchParams]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    description: '',
    beneficiary: '',
    category: 'other',
    budgetAmount: 0,
    budgetAsset: 'USDC',
    blockchainEnabled: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const result = await createProject(form);
    setSaving(false);
    if (result) {
      setIsFormOpen(false);
      setForm({ name: '', description: '', beneficiary: '', category: 'other', budgetAmount: 0, budgetAsset: 'USDC', blockchainEnabled: true });
    } else {
      setSaveError('Error al crear el proyecto. Verifica que estés autenticado.');
    }
  };

  if (error === 'unauthenticated') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-zinc-600 text-lg">Tu sesión expiró o no estás autenticado.</p>
        <Button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
          Iniciar sesión con wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Projects</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage your fund management projects</p>
        </div>
        <Button
          className="bg-[#0F52BA] hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors self-start sm:self-auto"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/20 py-24 px-4 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-500 dark:border-blue-900/30 rounded-2xl mb-5">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">No projects yet</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 max-w-sm mt-1 mb-6">
            Create your first project to start tracking funds transparently
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg" onClick={() => setIsFormOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const pct = p.budgetAmount > 0 ? Math.round((p.spentAmount / p.budgetAmount) * 100) : 0;
            const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
            return (
              <Card key={p.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/projects/${p.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{p.name}</CardTitle>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {CATEGORY_LABELS[p.category] ?? p.category}
                    {p.blockchainEnabled && <span className="ml-1 text-blue-500 font-medium">· ⛓ Blockchain</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{p.description}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Presupuesto ejecutado</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{p.spentAmount.toLocaleString()} {p.budgetAsset}</span>
                      <span>{p.budgetAmount.toLocaleString()} {p.budgetAsset}</span>
                    </div>
                  </div>
                  {p.currentStage && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>Etapa: <span className="font-medium text-zinc-700 dark:text-zinc-300">{p.currentStage}</span></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full sm:max-w-2xl bg-[#fafafa] border border-zinc-200 text-zinc-950 max-h-[90vh] overflow-y-auto p-6 space-y-6 rounded-xl shadow-lg">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">Crear nuevo proyecto</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">Configura un nuevo proyecto de gestión de fondos</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-5">
            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900">Detalles del proyecto</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Información básica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Nombre del proyecto *</label>
                  <Input placeholder="Ej. Construcción escuela Fase 1" required className="border-zinc-300 bg-white text-zinc-900 h-9"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Descripción</label>
                  <Textarea placeholder="Describe el alcance y objetivos..." className="border-zinc-300 bg-white text-zinc-900 min-h-[80px]"
                    value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Beneficiario</label>
                    <Input placeholder="Ej. Comunidad de San Pedro" className="border-zinc-300 bg-white text-zinc-900 h-9"
                      value={form.beneficiary} onChange={(e) => setForm((f) => ({ ...f, beneficiary: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Categoría</label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-zinc-900">Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Presupuesto total *</label>
                    <Input type="number" placeholder="0" min={1} required className="border-zinc-300 bg-white text-zinc-900 h-9"
                      value={form.budgetAmount || ''} onChange={(e) => setForm((f) => ({ ...f, budgetAmount: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Moneda</label>
                    <Select value={form.budgetAsset} onValueChange={(v) => setForm((f) => ({ ...f, budgetAsset: v }))}>
                      <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="XLM">XLM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Fecha de inicio</label>
                    <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9"
                      value={form.startDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || undefined }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Fecha de fin</label>
                    <Input type="date" className="border-zinc-300 bg-white text-zinc-900 h-9"
                      value={form.endDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || undefined }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200/80 shadow-sm">
              <CardContent className="flex items-center justify-between p-4 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    Verificación blockchain
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-[340px]">
                    Registra hashes de transacciones en Stellar Testnet para transparencia pública
                  </p>
                </div>
                <Switch
                  checked={form.blockchainEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, blockchainEnabled: v }))}
                  className="data-[state=checked]:bg-blue-600"
                />
              </CardContent>
            </Card>

            {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 font-medium text-xs h-9 px-4">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-5 shadow-sm disabled:opacity-60">
                {saving ? 'Creando…' : 'Crear proyecto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
