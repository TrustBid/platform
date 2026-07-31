'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader, SettingsCard } from './shared';

type Tone = 'blue' | 'violet' | 'green' | 'amber';

/**
 * Áreas de demo. Todavía no hay endpoint de áreas en la API — cuando exista,
 * esto se reemplaza por un hook `useAreas()` con el mismo shape.
 */
const AREAS: {
  id: string;
  name: string;
  description: string;
  members: number;
  budget: number;
  spent: number;
  tone: Tone;
}[] = [
  {
    id: 'a1',
    name: 'Obras',
    description: 'Proyectos de infraestructura y construcción.',
    members: 3,
    budget: 12000,
    spent: 8400,
    tone: 'blue',
  },
  {
    id: 'a2',
    name: 'Educación',
    description: 'Programas educativos y becas.',
    members: 2,
    budget: 8000,
    spent: 3200,
    tone: 'violet',
  },
  {
    id: 'a3',
    name: 'Salud',
    description: 'Brigadas y atención médica.',
    members: 2,
    budget: 6000,
    spent: 5100,
    tone: 'green',
  },
  {
    id: 'a4',
    name: 'Administración',
    description: 'Finanzas, contabilidad y reportería.',
    members: 4,
    budget: 4000,
    spent: 1800,
    tone: 'amber',
  },
];

const ICON_BG: Record<Tone, string> = {
  blue: 'bg-[#dee8fc] dark:bg-blue-950/60',
  violet: 'bg-[#eee6fb] dark:bg-violet-950/60',
  green: 'bg-[#dbf4ec] dark:bg-emerald-950/60',
  amber: 'bg-[#fdf0db] dark:bg-amber-950/60',
};

/** Por encima de este % de ejecución se avisa que el presupuesto se agota. */
const ALERT_THRESHOLD = 85;

/** Montos en dólares con separador de miles, como en el diseño: $12,000. */
const money = (n: number) => `$${n.toLocaleString('en-US')}`;

function AreaCard({ area }: { area: (typeof AREAS)[number] }) {
  // Un área sin presupuesto asignado se muestra en 0%, no como NaN.
  const pct = area.budget > 0 ? Math.round((area.spent / area.budget) * 100) : 0;
  const nearLimit = pct >= ALERT_THRESHOLD;

  // El color de la barra sigue el tono del área, salvo cuando está en alerta.
  const barColor = nearLimit
    ? 'bg-red-600'
    : { blue: 'bg-blue-600', violet: 'bg-violet-600', green: 'bg-emerald-600', amber: 'bg-amber-500' }[
        area.tone
      ];
  const pctColor = nearLimit
    ? 'text-red-600 dark:text-red-400'
    : {
        blue: 'text-blue-600 dark:text-blue-400',
        violet: 'text-violet-600 dark:text-violet-400',
        green: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
      }[area.tone];

  return (
    <SettingsCard className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <div className={`size-9 shrink-0 rounded-lg ${ICON_BG[area.tone]}`} />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{area.name}</p>
          <p className="text-[11px] text-muted-foreground">{area.description}</p>
          <p className="text-[11px] text-muted-foreground">{area.members} miembros</p>
        </div>
      </div>

      <div className="space-y-2 border-y border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Presupuesto asignado
          </span>
          <span className="text-xs font-semibold text-foreground">{money(area.budget)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Ejecutado: {money(area.spent)}
          </span>
          <span className={`text-[11px] font-semibold ${pctColor}`}>{pct}%</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Próximamente"
          className="h-7 rounded-md px-4 text-xs font-medium"
        >
          Editar
        </Button>
        <Button
          size="sm"
          disabled
          title="Próximamente"
          className="h-7 rounded-md bg-[#edf1fe] px-3 text-xs font-medium text-blue-600 hover:bg-[#dee8fc] dark:bg-blue-950/50 dark:text-blue-400"
        >
          → Ver área
        </Button>
        {nearLimit && (
          <span className="inline-flex items-center rounded-md border border-red-600 bg-[#fee9e8] px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
            ⚠ Alerta: presupuesto casi agotado
          </span>
        )}
      </div>
    </SettingsCard>
  );
}

export function AreasTab() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Áreas"
        action={
          <Button
            disabled
            title="Próximamente"
            className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            + Nueva área
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AREAS.map((a) => (
          <AreaCard key={a.id} area={a} />
        ))}
      </div>
    </div>
  );
}
