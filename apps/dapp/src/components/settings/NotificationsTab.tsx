'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CurrentUser } from '@/hooks/useCurrentUser';
import { Pill, SectionHeader, SettingsCard, StatusDot } from './shared';

type Channel = 'email' | 'whatsapp';
type Prefs = Record<string, Record<Channel, boolean>>;

const GROUPS: { title: string; events: { id: string; label: string }[] }[] = [
  {
    title: 'Gastos y facturas',
    events: [
      { id: 'invoice.uploaded', label: 'Nueva factura subida' },
      { id: 'invoice.validated', label: 'Factura validada por el Contador' },
      { id: 'invoice.rejected', label: 'Factura rechazada' },
    ],
  },
  {
    title: 'Desembolsos',
    events: [
      { id: 'disbursement.sent', label: 'Desembolso enviado al área' },
      { id: 'payment.confirmed', label: 'Pago confirmado (con código)' },
      { id: 'disbursement.delayed', label: 'Desembolso demorado (>24h)' },
    ],
  },
  {
    title: 'Proyectos',
    events: [
      { id: 'pipeline.advanced', label: 'Etapa del pipeline avanzada' },
      { id: 'budget.alert', label: 'Alerta de presupuesto (>85%)' },
      { id: 'report.ready', label: 'Reporte listo para exportar' },
    ],
  },
];

const DEFAULT_PREFS: Prefs = {
  'invoice.uploaded': { email: true, whatsapp: false },
  'invoice.validated': { email: true, whatsapp: true },
  'invoice.rejected': { email: true, whatsapp: true },
  'disbursement.sent': { email: true, whatsapp: false },
  'payment.confirmed': { email: true, whatsapp: true },
  'disbursement.delayed': { email: true, whatsapp: true },
  'pipeline.advanced': { email: true, whatsapp: false },
  'budget.alert': { email: true, whatsapp: true },
  'report.ready': { email: false, whatsapp: false },
};

export function NotificationsTab({ user }: { user: CurrentUser | null }) {
  // Estado local: todavía no hay endpoint de preferencias de notificación.
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  const toggle = (eventId: string, channel: Channel) =>
    setPrefs((p) => ({
      ...p,
      [eventId]: { ...p[eventId], [channel]: !p[eventId][channel] },
    }));

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Notificaciones"
        description="Elegí cuándo y cómo recibís avisos."
      />

      <SettingsCard className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="flex-1">Evento</span>
          <span className="w-16 text-center">Email</span>
          <span className="w-20 text-center">WhatsApp</span>
        </div>

        {GROUPS.map((group) => (
          <React.Fragment key={group.title}>
            <div className="border-b border-border bg-muted/30 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </div>
            {group.events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <span className="flex-1 text-[13px] text-foreground">{ev.label}</span>
                <span className="flex w-16 justify-center">
                  <Switch
                    checked={prefs[ev.id].email}
                    onCheckedChange={() => toggle(ev.id, 'email')}
                    aria-label={`${ev.label} — Email`}
                    className="data-checked:bg-blue-600"
                  />
                </span>
                <span className="flex w-20 justify-center">
                  <Switch
                    checked={prefs[ev.id].whatsapp}
                    onCheckedChange={() => toggle(ev.id, 'whatsapp')}
                    aria-label={`${ev.label} — WhatsApp`}
                    className="data-checked:bg-blue-600"
                  />
                </span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </SettingsCard>

      <SettingsCard>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Canales configurados</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <StatusDot className={user?.email ? 'bg-emerald-500' : 'bg-amber-500'} />
          <span
            className={`text-[13px] ${user?.email ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Email — {user?.email ?? 'sin correo registrado'}
          </span>
          {user?.email && <Pill tone="green">Verificado</Pill>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusDot className="bg-amber-500" />
            <span className="text-[13px] text-muted-foreground">
              WhatsApp — no configurado
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Próximamente"
            className="h-7 rounded-md px-3 text-xs font-medium"
          >
            Configurar →
          </Button>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button
          disabled
          title="Próximamente — aún no hay endpoint de preferencias"
          className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
        >
          Guardar preferencias
        </Button>
      </div>
    </div>
  );
}
