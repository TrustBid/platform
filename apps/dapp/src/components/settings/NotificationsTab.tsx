'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CurrentUser } from '@/hooks/useCurrentUser';
import {
  useNotificationPreferences,
  type NotificationPreference,
} from '@/hooks/useSettingsResources';
import { Pill, SectionHeader, SettingsCard, StatusDot } from './shared';

type Channel = 'email' | 'whatsapp';

const GROUPS: { title: string; events: { id: string; label: string }[] }[] = [
  {
    title: 'Gastos y facturas',
    events: [
      { id: 'invoice.uploaded', label: 'Nueva factura subida' },
      { id: 'invoice.validated', label: 'Factura validada' },
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

const CHANNELS: Channel[] = ['email', 'whatsapp'];

const keyOf = (eventKey: string, channel: Channel) => `${eventKey}:${channel}`;

export function NotificationsTab({
  user,
  isAdmin,
}: {
  user: CurrentUser | null;
  isAdmin: boolean;
}) {
  const { preferences, loading, save } = useNotificationPreferences();
  // Ediciones locales sobre lo que vino del servidor; ausente = sin tocar.
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stored = new Map(
    preferences.map((p) => [keyOf(p.eventKey, p.channel as Channel), p.enabled]),
  );

  // Un evento sin fila guardada está apagado: no inventamos activaciones.
  const isEnabled = (eventKey: string, channel: Channel) =>
    edits[keyOf(eventKey, channel)] ?? stored.get(keyOf(eventKey, channel)) ?? false;

  const toggle = (eventKey: string, channel: Channel) =>
    setEdits((prev) => ({
      ...prev,
      [keyOf(eventKey, channel)]: !isEnabled(eventKey, channel),
    }));

  const dirty = Object.keys(edits).length > 0;

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    // Mandamos el set completo: el backend hace upsert por (evento, canal).
    const payload: NotificationPreference[] = GROUPS.flatMap((g) =>
      g.events.flatMap((ev) =>
        CHANNELS.map((ch) => ({
          eventKey: ev.id,
          channel: ch,
          enabled: isEnabled(ev.id, ch),
        })),
      ),
    );

    const ok = await save(payload);
    setSaving(false);
    if (ok) {
      setEdits({});
      setMessage('Preferencias guardadas.');
    } else {
      setError('No se pudieron guardar las preferencias.');
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Notificaciones"
        description="Elegí cuándo y cómo recibís avisos."
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
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
                  {CHANNELS.map((ch) => (
                    <span
                      key={ch}
                      className={`flex justify-center ${ch === 'email' ? 'w-16' : 'w-20'}`}
                    >
                      <Switch
                        checked={isEnabled(ev.id, ch)}
                        onCheckedChange={() => toggle(ev.id, ch)}
                        disabled={!isAdmin}
                        aria-label={`${ev.label} — ${ch === 'email' ? 'Email' : 'WhatsApp'}`}
                        className="data-checked:bg-blue-600"
                      />
                    </span>
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </SettingsCard>
      )}

      <SettingsCard>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Canales configurados</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <StatusDot className={user?.email ? 'bg-emerald-500' : 'bg-amber-500'} />
          <span
            className={`text-[13px] ${user?.email ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Email — {user?.email ?? 'sin correo registrado'}
          </span>
          {user?.email && <Pill tone="green">Verificado</Pill>}
        </div>
      </SettingsCard>

      {isAdmin && (
        <div className="flex items-center justify-end gap-3">
          {message && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {message}
            </span>
          )}
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            {saving ? 'Guardando…' : 'Guardar preferencias'}
          </Button>
        </div>
      )}
    </div>
  );
}
