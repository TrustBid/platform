'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOrg } from '@/hooks/useOrg';
import { VolunteerInvites } from '@/components/dashboard/VolunteerInvites';
import { GeneralTab } from '@/components/settings/GeneralTab';
import { UsersTab } from '@/components/settings/UsersTab';
import { AreasTab } from '@/components/settings/AreasTab';
import { TemplatesTab } from '@/components/settings/TemplatesTab';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { BillingTab } from '@/components/settings/BillingTab';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'users', label: 'Usuarios y roles' },
  { id: 'areas', label: 'Áreas' },
  { id: 'templates', label: 'Plantillas' },
  { id: 'integrations', label: 'Integraciones' },
  { id: 'notifications', label: 'Notificaciones' },
  { id: 'billing', label: 'Facturación' },
  // Fuera del diseño de Figma, pero es funcionalidad real ya en producción.
  { id: 'volunteers', label: 'Voluntarios' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('general');
  const { user } = useCurrentUser();
  const { org, refetch: refetchOrg } = useOrg();

  const visibleTabs = TABS.filter(
    (t) => t.id !== 'volunteers' || user?.role === 'admin',
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">
            Configuración
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Gestioná tu cuenta, equipo y preferencias.
          </p>
        </div>
        <ModeToggle />
      </div>

      {/* Barra de pestañas */}
      <div
        role="tablist"
        aria-label="Secciones de configuración"
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1"
      >
        {visibleTabs.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                selected
                  ? 'border border-border bg-card font-semibold text-blue-600 shadow-sm dark:text-blue-400'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'general' && (
        <GeneralTab user={user} org={org} onOrgSaved={refetchOrg} />
      )}
      {tab === 'users' && <UsersTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'notifications' && <NotificationsTab user={user} />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'volunteers' && <VolunteerInvites />}
    </div>
  );
}
