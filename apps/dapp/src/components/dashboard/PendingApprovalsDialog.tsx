'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Link2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { authHeaders } from '@/lib/auth/sep10';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface PendingTx {
  id: string;
  memo_id: string;
  amount: string;
  asset_code: string;
  settlement_type: string | null;
  ai_match: boolean | null;
  created_by: string | null;
}

interface TxDetail {
  id: string;
  memoId: string;
  beneficiary: string;
  concept: string;
  category: string;
  amount: number;
  assetCode: string;
  settlementType: string | null;
  ai: { amount: number | null; match: boolean | null; confidence: number | null; flags: string | null };
  invoiceNumber: string | null;
  taxId: string | null;
  invoiceDate: string | null;
  submitterPhone: string | null;
  createdByName: string | null;
  createdByRole: string | null;
  invoiceUrl: string | null;
}

export function PendingApprovalsDialog({
  projectId,
  pending,
  currentUserId,
  onReviewed,
}: {
  projectId: string;
  pending: PendingTx[];
  currentUserId?: string;
  onReviewed: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PendingTx | null>(null);
  const [detail, setDetail] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function openDetail(tx: PendingTx) {
    setSelected(tx);
    setDetail(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/my/projects/${projectId}/transactions/${tx.id}`, { headers: authHeaders() });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function review(action: 'approve' | 'reject') {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/my/projects/${projectId}/transactions/${selected.id}/${action}`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.status === 401) { router.push('/login'); return; }
      setSelected(null);
      setDetail(null);
      onReviewed();
    } finally {
      setBusy(false);
    }
  }

  const back = () => { setSelected(null); setDetail(null); };
  const isOwn = selected?.created_by && selected.created_by === currentUserId;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
        onClick={() => { back(); setOpen(true); }}
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        Pendientes de aprobación
        {pending.length > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
            {pending.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-3xl bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white max-h-[92vh] overflow-y-auto p-6 rounded-xl">
          {!selected ? (
            // ── Lista de pendientes ──
            <>
              <h2 className="text-lg font-bold mb-1">Pendientes de aprobación</h2>
              <p className="text-xs text-zinc-500 mb-4">Revisá cada gasto (datos + factura) y aprobalo o rechazalo.</p>
              {pending.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">No hay transacciones pendientes. 🎉</p>
              ) : (
                <div className="space-y-2">
                  {pending.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => openDetail(tx)}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{tx.memo_id}</span>
                        {tx.ai_match === false && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" aria-label="Monto no coincide con la factura" />
                        )}
                        {tx.settlement_type === 'cash' ? (
                          <Badge variant="warning" className="gap-1"><Banknote className="h-3 w-3" />Efectivo</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><Link2 className="h-3 w-3" />On-chain</Badge>
                        )}
                      </div>
                      <span className="font-semibold">{Number(tx.amount).toLocaleString('es-CO')} {tx.asset_code}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            // ── Detalle: datos + imagen ──
            <>
              <button onClick={back} className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                <ArrowLeft className="h-4 w-4" /> Volver a la lista
              </button>

              {loading ? (
                <p className="py-10 text-center text-sm text-zinc-500">Cargando…</p>
              ) : !detail ? (
                <p className="py-10 text-center text-sm text-red-600">No se pudo cargar el detalle.</p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Datos */}
                  <div className="space-y-2.5 text-sm">
                    <p className="font-mono text-xs text-zinc-500">{detail.memoId}</p>
                    <Field label="Proveedor / Beneficiario" value={detail.beneficiary} />
                    <Field label="Concepto" value={detail.concept} />
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500">Monto declarado</p>
                        <p className="font-semibold">{detail.amount.toLocaleString('es-CO')} {detail.assetCode}</p>
                      </div>
                      {detail.ai.amount != null && (
                        detail.ai.match ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Coincide con factura
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> Factura: $ {detail.ai.amount}
                          </span>
                        )
                      )}
                    </div>
                    {detail.ai.confidence != null && (
                      <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Sparkles className="h-3 w-3" /> Confianza IA: {Math.round(detail.ai.confidence * 100)}%
                      </p>
                    )}
                    <Field label="Nº factura" value={detail.invoiceNumber ?? '—'} />
                    <Field label="NIT / RUC" value={detail.taxId ?? '—'} />
                    <Field label="Fecha factura" value={detail.invoiceDate ?? '—'} />
                    <div>
                      <p className="text-xs text-zinc-500">Liquidación</p>
                      <p className="font-medium">{detail.settlementType === 'cash' ? 'Efectivo · atestiguado' : 'On-chain · verificable'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Cargada por</p>
                      <p className="font-medium">
                        {detail.createdByName ?? '—'} {detail.createdByRole && `(${detail.createdByRole})`}
                        {detail.submitterPhone && ` · WhatsApp +${detail.submitterPhone}`}
                      </p>
                    </div>
                  </div>

                  {/* Imagen de la factura */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Comprobante</p>
                    {detail.invoiceUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detail.invoiceUrl}
                          alt="Factura"
                          className="max-h-72 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 object-contain bg-zinc-50 dark:bg-zinc-900"
                        />
                        <a
                          href={detail.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Abrir factura <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-400">
                        Sin comprobante adjunto
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detail && (
                <div className="mt-5 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  {isOwn ? (
                    <p className="text-xs text-amber-600">Vos cargaste esta transacción — debe aprobarla otro rol.</p>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" disabled={busy} onClick={() => review('reject')} className="h-9">
                        Rechazar
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() => review('approve')}
                        className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {busy ? 'Procesando…' : 'Aprobar y anclar'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
