'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Banknote,
  Camera,
  CheckCircle2,
  Download,
  FileWarning,
  Link2,
  Plus,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { authHeaders } from '@/lib/auth/sep10';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

const CATEGORIES = ['Materiales', 'Mano de obra', 'Equipamiento', 'Transporte', 'Insumos', 'Otros'];

interface FormState {
  beneficiary: string;
  concept: string;
  category: string;
  amount: string;
  invoiceDate: string;
  invoiceNumber: string;
  taxId: string;
  settlementType: 'on_chain' | 'cash';
}

const EMPTY_FORM: FormState = {
  beneficiary: '',
  concept: '',
  category: '',
  amount: '',
  invoiceDate: '',
  invoiceNumber: '',
  taxId: '',
  settlementType: 'on_chain',
};

/** Resultado de la extracción con IA del comprobante. */
interface OcrResult {
  enabled: boolean;
  amount: number | null;
  confidence: number | null;
}

export function RegisterTransactionDialog({
  projectId,
  projectName,
  canSelfApprove = false,
  onCreated,
}: {
  projectId: string;
  projectName: string;
  /** Si el usuario tiene rol de aprobador (admin), su carga directa se ancla al instante. */
  canSelfApprove?: boolean;
  onCreated: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const resetAll = () => {
    setStep(1);
    setFile(null);
    setPreviewUrl(null);
    setOcrStatus('idle');
    setOcr(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  // Compara en vivo el monto tipeado contra el detectado por la IA (tolerancia 1%).
  const amountMatch: boolean | null =
    ocr?.amount != null && Number(form.amount) > 0
      ? Math.abs(ocr.amount - Number(form.amount)) <= Math.max(0.01, Number(form.amount) * 0.01)
      : null;

  const openDialog = () => {
    resetAll();
    setOpen(true);
  };

  async function handleFile(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setOcrStatus('processing');
    setOcr(null);
    setError(null);

    // OCR + extracción reales vía backend (Gemini). Prellena los campos detectados;
    // el monto queda editable para que el Contador lo confirme/corrija.
    try {
      const fd = new FormData();
      fd.set('file', selected);
      const res = await fetch(`${API}/my/projects/${projectId}/transactions/ocr`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: fd,
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('ocr_failed');

      const data: {
        enabled: boolean;
        extraction: {
          vendor: string | null;
          amount: number | null;
          invoiceDate: string | null;
          invoiceNumber: string | null;
          taxId: string | null;
          confidence: number | null;
        } | null;
      } = await res.json();

      const ex = data.extraction;
      if (ex) {
        set({
          beneficiary: ex.vendor ?? '',
          invoiceDate: ex.invoiceDate ?? '',
          invoiceNumber: ex.invoiceNumber ?? '',
          taxId: ex.taxId ?? '',
          amount: ex.amount != null ? String(ex.amount) : '',
        });
      }
      setOcr({ enabled: data.enabled, amount: ex?.amount ?? null, confidence: ex?.confidence ?? null });
    } catch {
      // La IA puede fallar o estar deshabilitada: permitimos carga manual igual.
      setOcr({ enabled: false, amount: null, confidence: null });
    } finally {
      setOcrStatus('done');
    }
  }

  const canSubmit =
    !!form.beneficiary.trim() && !!form.concept.trim() && !!form.category && Number(form.amount) > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Completá proveedor, concepto, categoría y un monto válido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('beneficiary', form.beneficiary.trim());
      fd.set('concept', form.concept.trim());
      fd.set('category', form.category);
      fd.set('amount', form.amount);
      fd.set('settlementType', form.settlementType);
      if (form.invoiceDate) fd.set('invoiceDate', form.invoiceDate);
      if (form.invoiceNumber) fd.set('invoiceNumber', form.invoiceNumber);
      if (form.taxId) fd.set('taxId', form.taxId);
      if (file) fd.set('file', file);

      const res = await fetch(`${API}/my/projects/${projectId}/transactions`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: fd,
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('error');

      setOpen(false);
      onCreated();
    } catch {
      setError('No se pudo registrar la transacción. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
        onClick={openDialog}
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar transacción
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-3xl bg-[#fafafa] border border-zinc-200 text-zinc-950 max-h-[95vh] overflow-y-auto p-8 rounded-xl shadow-lg space-y-6">
          {step === 1 ? (
            <>
              <div className="flex flex-col gap-1 text-left border-b border-zinc-200/60 pb-4">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Agregar transacción</h2>
                <p className="text-xs text-zinc-500">{projectName}</p>
              </div>

              <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold text-zinc-900">Subir comprobante</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Foto o PDF de la factura o recibo
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFile(e.dataTransfer.files?.[0] ?? null);
                    }}
                    className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40"
                  >
                    <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">
                      Arrastrá o hacé clic para subir
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">JPG, PNG o PDF · máx. 15 MB</p>
                    {file && <p className="mt-3 text-xs font-semibold text-blue-600">{file.name}</p>}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />

                  <div className="flex justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1.5 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                      Tomar foto
                    </Button>
                    <Button
                      type="button"
                      className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Elegir archivo
                    </Button>
                  </div>

                  {ocrStatus === 'processing' && (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 py-3 text-sm font-medium text-blue-700">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Procesando OCR…
                    </div>
                  )}

                  {ocrStatus === 'done' && (
                    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900">Campos extraídos por IA</p>
                        {ocr?.enabled ? (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" /> Gemini
                            {ocr.confidence != null && ` · ${Math.round(ocr.confidence * 100)}%`}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> IA no disponible
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">Proveedor</p>
                          <p className="font-medium text-zinc-800">{form.beneficiary}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Fecha</p>
                          <p className="font-medium text-zinc-800">{form.invoiceDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Monto</p>
                          <p className="font-medium text-zinc-800">{form.amount ? `$ ${form.amount}` : '— (completar)'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">NIT/RUC</p>
                          <p className="font-medium text-zinc-800">{form.taxId || '—'}</p>
                        </div>
                      </div>
                      <p className="flex items-start gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        La IA extrae los campos pero NO confirma automáticamente. Validá los datos antes de anclar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  disabled={ocrStatus !== 'done'}
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Revisar comprobante
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1 text-left border-b border-zinc-200/60 pb-4">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Revisar comprobante</h2>
                <p className="text-xs text-zinc-500">{projectName}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-zinc-900">Documento adjunto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5 pt-0">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Comprobante"
                        className="max-h-64 w-full rounded-lg border border-zinc-200 object-contain bg-zinc-50"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400">
                        <FileWarning className="h-6 w-6" />
                      </div>
                    )}
                    {file && (
                      <a
                        href={previewUrl ?? undefined}
                        download={file.name}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" /> Descargar original
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border-zinc-200 shadow-sm rounded-xl">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-zinc-900">Campos extraídos por IA</CardTitle>
                    <Badge variant="warning">Pendiente validación</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5 pt-0">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Proveedor / Beneficiario</label>
                      <Input
                        value={form.beneficiary}
                        onChange={(e) => set({ beneficiary: e.target.value })}
                        className="border-zinc-300 bg-white text-zinc-900 h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Concepto / Descripción</label>
                      <Textarea
                        value={form.concept}
                        onChange={(e) => set({ concept: e.target.value })}
                        className="border-zinc-300 bg-white text-zinc-900 min-h-[70px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700">Monto (USD)</label>
                        <Input
                          type="number"
                          value={form.amount}
                          onChange={(e) => set({ amount: e.target.value })}
                          className="border-zinc-300 bg-white text-zinc-900 h-9"
                        />
                        {amountMatch === true && (
                          <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Coincide con la factura (IA)
                          </p>
                        )}
                        {amountMatch === false && (
                          <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <XCircle className="h-3 w-3" /> No coincide con la factura
                            {ocr?.amount != null && ` ($ ${ocr.amount})`}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700">Fecha de la factura</label>
                        <Input
                          type="date"
                          value={form.invoiceDate}
                          onChange={(e) => set({ invoiceDate: e.target.value })}
                          className="border-zinc-300 bg-white text-zinc-900 h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700">Categoría</label>
                        <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                          <SelectTrigger className="border-zinc-300 bg-white text-zinc-900 h-9">
                            <SelectValue placeholder="Elegir" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200 text-zinc-900">
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700">Número de factura</label>
                        <Input
                          value={form.invoiceNumber}
                          onChange={(e) => set({ invoiceNumber: e.target.value })}
                          className="border-zinc-300 bg-white text-zinc-900 h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">NIT / RUC</label>
                      <Input
                        value={form.taxId}
                        onChange={(e) => set({ taxId: e.target.value })}
                        className="border-zinc-300 bg-white text-zinc-900 h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700">Tipo de liquidación</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => set({ settlementType: 'on_chain' })}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            form.settlementType === 'on_chain'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <Link2 className="h-3.5 w-3.5" /> On-chain (verificable)
                        </button>
                        <button
                          type="button"
                          onClick={() => set({ settlementType: 'cash' })}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            form.settlementType === 'cash'
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <Banknote className="h-3.5 w-3.5" /> Efectivo (atestiguado)
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <p className="flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {canSelfApprove ? (
                  <>Al registrar, el hash del comprobante se <strong>ancla on-chain</strong> (Stellar/Soroban) al instante.</>
                ) : (
                  <>Queda <strong>pendiente de aprobación</strong>. Un aprobador (admin) debe validarla; recién ahí se ancla el hash on-chain.</>
                )}
              </p>
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50"
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  disabled={submitting || !canSubmit}
                  onClick={handleSubmit}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? 'Registrando…' : canSelfApprove ? 'Registrar y anclar' : 'Registrar (pendiente de aprobación)'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
