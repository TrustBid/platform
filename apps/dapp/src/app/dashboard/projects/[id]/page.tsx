'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Layers, CheckCircle2, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authHeaders } from '@/lib/auth/sep10';
import { BlockchainAnchorBadge, VerifyOnChainButton } from '@/components/blockchain/BlockchainAnchorBadge';
import { explorerTxUrl } from '@/lib/stellar-explorer';

import { API_BASE_URL as API } from '@/lib/api/base-url';

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
  draft:     { label: 'Borrador',   color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
  active:    { label: 'Activo',     color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  paused:    { label: 'Pausado',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
};

const TX_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'text-yellow-600 dark:text-yellow-400' },
  confirmed: { label: 'Confirmada', color: 'text-emerald-600 dark:text-emerald-400' },
  failed:    { label: 'Fallida',    color: 'text-red-600 dark:text-red-400' },
};

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  beneficiary: string | null;
  category: string;
  status: string;
  budget_amount: string;
  spent_amount: string;
  budget_asset: string;
  blockchain_enabled: boolean;
  allocation_tx_hash: string | null;
  blockchain_status: string | null;
  start_date: string | null;
  end_date: string | null;
  current_stage: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  memo_id: string;
  tx_hash: string | null;
  amount: string;
  asset_code: string;
  status: string;
  executed_at: string | null;
  description: string | null;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (!project || newStatus === project.status) return;
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`${API}/my/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('error');
      setProject(await res.json());
    } catch {
      setStatusError('No se pudo actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function loadTransactions() {
    const txRes = await fetch(`${API}/my/projects/${id}/transactions`, { headers: authHeaders() });
    if (txRes.ok) setTransactions(await txRes.json());
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/my/projects/${id}`, { headers: authHeaders() });
        if (res.status === 404) { setNotFound(true); return; }
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) throw new Error('error');
        const data = await res.json();
        setProject(data);

        // Cargar transacciones del proyecto
        await loadTransactions();
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#050505]">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <AlertCircle className="h-10 w-10 text-zinc-400" />
        <p className="text-zinc-600 dark:text-zinc-400 text-lg font-medium">Proyecto no encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a proyectos
        </Button>
      </div>
    );
  }

  const budgetAmount = Number(project.budget_amount);
  const spentAmount = Number(project.spent_amount);
  const pct = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/projects')}
          className="shrink-0 gap-1.5 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Proyectos
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{project.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {project.blockchain_enabled && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Blockchain
              </span>
            )}
          </div>
          {project.blockchain_enabled && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <BlockchainAnchorBadge
                txHash={project.allocation_tx_hash}
                status={project.blockchain_status}
              />
              <VerifyOnChainButton
                verifying={verifying}
                onVerify={async () => {
                  setVerifying(true);
                  setVerifyMsg(null);
                  try {
                    const res = await fetch(`${API}/my/projects/${id}/on-chain`, {
                      headers: authHeaders(),
                    });
                    if (!res.ok) throw new Error('failed');
                    const onChain = await res.json();
                    if (!onChain) {
                      setVerifyMsg('Sin datos on-chain para este proyecto.');
                    } else {
                      setVerifyMsg(
                        `On-chain: ${onChain.amountXlm} XLM (ledger ${onChain.allocatedAt})`,
                      );
                    }
                  } catch {
                    setVerifyMsg('No se pudo verificar on-chain.');
                  } finally {
                    setVerifying(false);
                  }
                }}
              />
              {verifyMsg && (
                <span className="text-xs text-zinc-500">{verifyMsg}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Layers className="h-3.5 w-3.5" />
            {CATEGORY_LABELS[project.category] ?? project.category}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">

          {/* Descripción */}
          {project.description && (
            <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
              <CardContent className="p-5">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Presupuesto */}
          <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Ejecutado</span>
                <span className="font-bold text-zinc-900 dark:text-white">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{spentAmount.toLocaleString('es-CO')} {project.budget_asset} gastados</span>
                <span>{budgetAmount.toLocaleString('es-CO')} {project.budget_asset} total</span>
              </div>
            </CardContent>
          </Card>

          {/* Etapa del pipeline */}
          <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Etapa del pipeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Etapa actual</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {project.current_stage ?? 'Sin etapa asignada'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    size="sm"
                    disabled
                    title="Disponible próximamente"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Avanzar etapa
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] text-zinc-400">Disponible próximamente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transacciones */}
          <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">
                Transacciones{transactions.length > 0 && ` (${transactions.length})`}
              </CardTitle>
              <RegisterTransactionDialog
                projectId={project.id}
                projectName={project.name}
                onCreated={loadTransactions}
              />
            </CardHeader>
            <CardContent className="pt-0">
              {transactions.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
                  Sin transacciones registradas aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['ID / Memo', 'Monto', 'Estado', 'Fecha', 'Hash'].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const txStatus = TX_STATUS[tx.status] ?? TX_STATUS.pending;
                        return (
                          <tr key={tx.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0">
                            <td className="px-3 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{tx.memo_id}</td>
                            <td className="px-3 py-3 font-semibold text-zinc-900 dark:text-white">
                              {Number(tx.amount).toLocaleString('es-CO')} {tx.asset_code}
                            </td>
                            <td className={`px-3 py-3 text-xs font-semibold ${txStatus.color}`}>
                              {txStatus.label}
                            </td>
                            <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                              {tx.executed_at ? new Date(tx.executed_at).toLocaleDateString('es-CO') : '—'}
                            </td>
                            <td className="px-3 py-3">
                              {tx.tx_hash ? (
                                <a
                                  href={explorerTxUrl(tx.tx_hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-mono"
                                >
                                  {tx.tx_hash.slice(0, 8)}…
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-zinc-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — metadata */}
        <div className="space-y-4">

          {/* Estado del proyecto */}
          <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">Estado del proyecto</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Select value={project.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                <SelectTrigger className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                  {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                    <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusError && <p className="text-xs text-red-600 dark:text-red-400">{statusError}</p>}
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardContent className="p-5 space-y-4">
              {project.beneficiary && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Beneficiario</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{project.beneficiary}</p>
                </div>
              )}
              {project.start_date && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Fecha de inicio</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {new Date(project.start_date).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}
              {project.end_date && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Fecha de cierre</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {new Date(project.end_date).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Creado</p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  {new Date(project.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
