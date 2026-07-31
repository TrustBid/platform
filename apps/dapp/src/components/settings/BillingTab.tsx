'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pill, SectionHeader, SettingsCard } from './shared';

/**
 * Datos de demo. No hay módulo de facturación en la API todavía; cuando exista,
 * esta pestaña se conecta a él sin cambiar la estructura visual.
 */
const PLAN = {
  name: 'Profesional',
  price: '$49 / mes · facturado mensualmente',
  nextCharge: '1 de agosto de 2026',
};

const USAGE: {
  label: string;
  used: number;
  limit: number | null;
}[] = [
  { label: 'Proyectos activos', used: 3, limit: 10 },
  { label: 'Usuarios', used: 5, limit: 10 },
  { label: 'Gastos registrados', used: 47, limit: null },
  { label: 'Reportes generados', used: 12, limit: null },
];

const PAYMENTS = [
  { date: '01 Jun 2026', amount: '$49.00' },
  { date: '01 May 2026', amount: '$49.00' },
  { date: '01 Apr 2026', amount: '$49.00' },
  { date: '01 Mar 2026', amount: '$49.00' },
];

export function BillingTab() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Facturación" />

      {/* Plan actual */}
      <SettingsCard className="border-blue-600">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="space-y-1">
            <Pill tone="blue">Plan actual</Pill>
            <p className="pt-1 text-2xl font-bold text-foreground">{PLAN.name}</p>
            <p className="text-xs text-muted-foreground">{PLAN.price}</p>
            <p className="text-xs text-foreground">Próximo cobro: {PLAN.nextCharge}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Próximamente"
              className="h-8 rounded-md px-4 text-xs font-medium"
            >
              Cambiar plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Próximamente"
              className="h-8 rounded-md border-red-500 px-4 text-xs font-medium text-red-600 dark:text-red-400"
            >
              Cancelar plan
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* Uso del período */}
      <SettingsCard>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="size-8 shrink-0 rounded-lg bg-[#dee8fc] dark:bg-blue-950/60" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Uso del período</h2>
            <p className="text-xs text-muted-foreground">Junio 2026</p>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {USAGE.map((u) => (
            <div key={u.label} className="flex flex-wrap items-center gap-3">
              <span className="min-w-40 flex-1 text-xs text-muted-foreground">
                {u.label}
              </span>
              <span className="w-28 text-xs font-semibold text-foreground">
                {u.used} / {u.limit ?? 'ilimitados'}
              </span>
              <span className="w-52">
                {u.limit === null ? (
                  <Pill tone="green">✓ Sin límite</Pill>
                ) : (
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-blue-600"
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

        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-32">Fecha</span>
          <span className="w-28">Monto</span>
          <span className="flex-1">Estado</span>
          <span className="w-[70px]" />
        </div>

        {PAYMENTS.map((p) => (
          <div
            key={p.date}
            className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
          >
            <span className="w-32 text-[13px] text-foreground">{p.date}</span>
            <span className="w-28 text-[13px] font-semibold text-foreground">
              {p.amount}
            </span>
            <span className="flex-1">
              <Pill tone="green">✓ Pagado</Pill>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Próximamente"
              className="h-6 w-[70px] shrink-0 rounded-md px-2 text-[11px] font-medium"
            >
              ↓ PDF
            </Button>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}
