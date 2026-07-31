'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { authHeaders } from '@/lib/auth/sep10';
import { API_BASE_URL as API } from '@/lib/api/base-url';
import { Pill, SectionHeader, SettingsCard } from './shared';

/** Lo que devuelve GET /my/org/settings/integrations. */
type ApiIntegration = {
  id: string;
  connected: boolean;
};

type Action = 'configurar' | 'conectar' | 'upgrade';

/**
 * Catálogo de integraciones tal como se le presentan al usuario.
 *
 * La API todavía devuelve nombres y detalles en terminología de infraestructura
 * ("Stellar Testnet", "USDC", saldos en XLM, dirección de wallet). De esa
 * respuesta sólo consumimos el flag `connected`: el nombre y la descripción
 * salen siempre de aquí, para que la UI no exponga jerga de blockchain.
 */
const CATALOG: {
  id: string;
  name: string;
  description: string;
  action: Action;
  /** Etiqueta cuando está conectada; por defecto "Conectado". */
  connectedLabel?: string;
  /** Se muestra como conectada sin consultar a la API. */
  alwaysOn?: boolean;
}[] = [
  {
    id: 'stellar',
    name: 'Red de verificación',
    description: 'Anclaje automático de movimientos para certificados.',
    action: 'configurar',
  },
  {
    id: 'usdc',
    name: 'Fondos digitales',
    description: 'Gestión de fondos para desembolsos y pagos a áreas.',
    action: 'configurar',
  },
  {
    id: 'email',
    name: 'Email / SMTP',
    description: 'Notificaciones por correo a donantes y equipo.',
    action: 'conectar',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp API',
    description: 'Avisos y reportes por WhatsApp al equipo de campo.',
    action: 'conectar',
  },
  {
    id: 'export',
    name: 'Exportar a Excel / CSV',
    description: 'Descarga de movimientos para el Contador.',
    action: 'configurar',
    connectedLabel: 'Activo',
    alwaysOn: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks (API)',
    description: 'Recibe eventos en tu sistema cuando ocurren pagos.',
    action: 'upgrade',
  },
];

export function IntegrationsTab() {
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/my/org/settings/integrations`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((items: ApiIntegration[]) =>
        setConnectedIds(new Set(items.filter((i) => i.connected).map((i) => i.id))),
      )
      // Sin respuesta de la API, todo se muestra como no conectado.
      .catch(() => setConnectedIds(new Set()))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Integraciones"
        description="Conectá herramientas externas a tu organización."
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {CATALOG.map((it) => {
            const connected = it.alwaysOn || connectedIds.has(it.id);
            return (
              <SettingsCard key={it.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`size-9 shrink-0 rounded-lg ${
                        connected
                          ? 'bg-[#dbf4ec] dark:bg-emerald-950/60'
                          : 'bg-muted'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{it.description}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Próximamente"
                          className="h-7.5 rounded-md px-3 text-xs font-medium"
                        >
                          Configurar
                        </Button>
                        <Pill tone="green">✓ {it.connectedLabel ?? 'Conectado'}</Pill>
                      </>
                    ) : it.action === 'upgrade' ? (
                      <Button
                        size="sm"
                        disabled
                        title="Próximamente"
                        className="h-7.5 rounded-md bg-[#eee6fb] px-3 text-xs font-medium text-violet-600 hover:bg-[#e5d9f9] dark:bg-violet-950/50 dark:text-violet-400"
                      >
                        ↑ Mejorar plan
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        title="Próximamente"
                        className="h-7.5 rounded-md bg-[#edf1fe] px-3 text-xs font-medium text-blue-600 hover:bg-[#dee8fc] dark:bg-blue-950/50 dark:text-blue-400"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </SettingsCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
