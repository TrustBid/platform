'use client';

import React, { useEffect, useState } from 'react';
import { authHeaders } from '@/lib/auth/sep10';
import { API_BASE_URL as API } from '@/lib/api/base-url';
import { Pill, SectionHeader, SettingsCard } from './shared';

/** Lo que devuelve GET /my/org/settings/integrations. */
type ApiIntegration = {
  id: string;
  connected: boolean;
};

/**
 * Cómo se le presenta al usuario cada integración que la API reporta.
 *
 * La API devuelve nombres y detalles en terminología de infraestructura
 * ("Stellar Testnet", "USDC", saldos en XLM, dirección de wallet). De esa
 * respuesta sólo consumimos `id` y `connected`: el nombre y la descripción
 * salen de acá, para que la UI no exponga jerga de blockchain.
 *
 * El diseño incluía además "Exportar a Excel / CSV" y "Webhooks (API)", pero
 * la API no reporta esas integraciones; se omiten en vez de inventarles estado.
 */
const PRESENTATION: Record<string, { name: string; description: string }> = {
  stellar: {
    name: 'Red de verificación',
    description: 'Anclaje automático de movimientos para certificados.',
  },
  usdc: {
    name: 'Fondos digitales',
    description: 'Gestión de fondos para desembolsos y pagos a áreas.',
  },
  email: {
    name: 'Email / SMTP',
    description: 'Notificaciones por correo a donantes y equipo.',
  },
  whatsapp: {
    name: 'WhatsApp API',
    description: 'Avisos y reportes por WhatsApp al equipo de campo.',
  },
};

export function IntegrationsTab() {
  const [items, setItems] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${API}/my/org/settings/integrations`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ApiIntegration[]) => setItems(data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  // Sólo mostramos lo que la API reporta y sabemos nombrar sin jerga técnica.
  const visible = items.filter((it) => PRESENTATION[it.id]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Integraciones"
        description="Estado de las herramientas conectadas a tu organización."
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : failed ? (
        <SettingsCard>
          <p className="p-6 text-center text-sm text-muted-foreground">
            No se pudo consultar el estado de las integraciones.
          </p>
        </SettingsCard>
      ) : (
        <div className="space-y-3">
          {visible.map((it) => {
            const { name, description } = PRESENTATION[it.id];
            return (
              <SettingsCard key={it.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`size-9 shrink-0 rounded-lg ${
                        it.connected ? 'bg-[#dbf4ec] dark:bg-emerald-950/60' : 'bg-muted'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>

                  {/* Sólo estado: la API es de lectura, no hay endpoint para
                      conectar ni configurar nada desde acá. */}
                  {it.connected ? (
                    <Pill tone="green">✓ Conectado</Pill>
                  ) : (
                    <Pill tone="neutral">Sin conectar</Pill>
                  )}
                </div>
              </SettingsCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
