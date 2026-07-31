'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBilling } from '@/hooks/useSettingsResources';
import { Pill, SectionHeader, SettingsCard } from './shared';

const money = (cents: number, currency: string) =>
  `${currency === 'USD' ? '$' : ''}${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
  })}`;

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function BillingTab({ isAdmin }: { isAdmin: boolean }) {
  const { summary, plans, loading, changePlan, cancel } = useBilling();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  async function handleChange(planCode: string) {
    setBusy(true);
    setError(null);
    const res = await changePlan(planCode);
    setBusy(false);
    if (res.ok) setPicking(false);
    else setError(res.message ?? 'No se pudo cambiar el plan.');
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const res = await cancel();
    setBusy(false);
    if (!res.ok) setError(res.message ?? 'No se pudo cancelar el plan.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Facturación" />
        <SettingsCard>
          <p className="p-8 text-center text-sm text-muted-foreground">
            No se pudo cargar la información de facturación.
          </p>
        </SettingsCard>
      </div>
    );
  }

  const cancelled = summary.status === 'cancelled';

  return (
    <div className="space-y-4">
      <SectionHeader title="Facturación" />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Plan actual */}
      <SettingsCard className={cancelled ? 'border-amber-500' : 'border-blue-600'}>
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="space-y-1">
            <Pill tone={cancelled ? 'amber' : 'blue'}>
              {cancelled ? 'Plan cancelado' : 'Plan actual'}
            </Pill>
            <p className="pt-1 text-2xl font-bold text-foreground">{summary.plan.name}</p>
            <p className="text-xs text-muted-foreground">
              {summary.plan.priceCents === 0
                ? 'Sin costo'
                : `${money(summary.plan.priceCents, summary.plan.currency)} / mes · facturado mensualmente`}
            </p>
            {summary.currentPeriodEnd && (
              <p className="text-xs text-foreground">
                {cancelled ? 'Activo hasta' : 'Próximo cobro'}:{' '}
                {longDate(summary.currentPeriodEnd)}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPicking((v) => !v)}
                disabled={busy}
                className="h-8 rounded-md px-4 text-xs font-medium"
              >
                Cambiar plan
              </Button>
              {!cancelled && summary.plan.priceCents > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={busy}
                  className="h-8 rounded-md border-red-500 px-4 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  Cancelar plan
                </Button>
              )}
            </div>
          )}
        </div>

        {picking && (
          <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-3">
            {plans.map((p) => {
              const current = p.code === summary.plan.code;
              return (
                <div
                  key={p.id}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.priceCents === 0
                      ? 'Sin costo'
                      : `${money(p.priceCents, p.currency)} / mes`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.maxProjects ?? 'Sin límite de'} proyectos ·{' '}
                    {p.maxUsers ?? 'sin límite de'} usuarios
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleChange(p.code)}
                    disabled={busy || current}
                    className="h-7 w-full rounded-md bg-blue-600 text-xs text-white hover:bg-blue-700"
                  >
                    {current ? 'Plan actual' : 'Elegir'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </SettingsCard>

      {/* Uso del período — contado sobre proyectos y usuarios reales. */}
      <SettingsCard>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="size-8 shrink-0 rounded-lg bg-[#dee8fc] dark:bg-blue-950/60" />
          <h2 className="text-sm font-semibold text-foreground">Uso del período</h2>
        </div>
        <div className="space-y-3 p-4">
          {summary.usage.map((u) => (
            <div key={u.label} className="flex flex-wrap items-center gap-3">
              <span className="min-w-40 flex-1 text-xs text-muted-foreground">{u.label}</span>
              <span className="w-28 text-xs font-semibold text-foreground">
                {u.used} / {u.limit ?? 'ilimitados'}
              </span>
              <span className="w-52">
                {u.limit === null ? (
                  <Pill tone="green">✓ Sin límite</Pill>
                ) : (
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className={`block h-full rounded-full ${
                        u.used > u.limit ? 'bg-red-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }}
                    />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Historial de pagos */}
      <SettingsCard className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="size-8 shrink-0 rounded-lg bg-[#dee8fc] dark:bg-blue-950/60" />
          <h2 className="text-sm font-semibold text-foreground">Historial de pagos</h2>
        </div>

        {summary.payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Todavía no hay cobros registrados.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="w-32">Fecha</span>
              <span className="w-28">Monto</span>
              <span className="flex-1">Estado</span>
              <span className="w-[70px]" />
            </div>
            {summary.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
              >
                <span className="w-32 text-[13px] text-foreground">{shortDate(p.paidAt)}</span>
                <span className="w-28 text-[13px] font-semibold text-foreground">
                  {money(p.amountCents, p.currency)}
                </span>
                <span className="flex-1">
                  <Pill tone={p.status === 'paid' ? 'green' : 'amber'}>
                    {p.status === 'paid' ? '✓ Pagado' : 'Pendiente'}
                  </Pill>
                </span>
                {p.invoiceUrl ? (
                  <a
                    href={p.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[70px] shrink-0 rounded-md border border-border px-2 py-1 text-center text-[11px] font-medium text-foreground"
                  >
                    ↓ PDF
                  </a>
                ) : (
                  <span className="w-[70px] shrink-0" />
                )}
              </div>
            ))}
          </>
        )}
      </SettingsCard>
    </div>
  );
}
