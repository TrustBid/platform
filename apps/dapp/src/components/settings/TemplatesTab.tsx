'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pill, SectionHeader, SettingsCard } from './shared';

type Tone = 'blue' | 'green' | 'violet' | 'amber';

/**
 * Plantillas de demo. `usePipeline` sólo expone las etapas de un proyecto
 * concreto; todavía no hay endpoint de plantillas a nivel de organización.
 */
const TEMPLATES: {
  id: string;
  name: string;
  description: string;
  activeProjects: number;
  stages: string[];
  tone: Tone;
}[] = [
  {
    id: 'p1',
    name: 'Construcción',
    description: 'Flujo estándar para proyectos de obra.',
    activeProjects: 3,
    stages: ['Diseño', 'Fondeo', 'Ejecución', 'Verificación', 'Cierre'],
    tone: 'blue',
  },
  {
    id: 'p2',
    name: 'Donación simple',
    description: 'Recepción y ejecución directa de fondos.',
    activeProjects: 1,
    stages: ['Fondeo', 'Ejecución', 'Cierre'],
    tone: 'green',
  },
  {
    id: 'p3',
    name: 'Programa por hitos',
    description: 'Desembolsos atados a hitos verificados.',
    activeProjects: 2,
    stages: ['Planificación', 'Hito 1', 'Hito 2', 'Hito 3', 'Cierre'],
    tone: 'violet',
  },
  {
    id: 'p4',
    name: 'Investigación',
    description: 'Para proyectos académicos con entregables.',
    activeProjects: 0,
    stages: ['Propuesta', 'Recolección', 'Análisis', 'Reporte'],
    tone: 'amber',
  },
];

const ICON_BG: Record<Tone, string> = {
  blue: 'bg-[#dee8fc] dark:bg-blue-950/60',
  green: 'bg-[#dbf4ec] dark:bg-emerald-950/60',
  violet: 'bg-[#eee6fb] dark:bg-violet-950/60',
  amber: 'bg-[#fdf0db] dark:bg-amber-950/60',
};

function TemplateCard({ template }: { template: (typeof TEMPLATES)[number] }) {
  const { activeProjects: active } = template;

  return (
    <SettingsCard>
      <div className="flex items-start gap-3 p-4">
        <div className={`size-9 shrink-0 rounded-lg ${ICON_BG[template.tone]}`} />
        <div className="min-w-0 space-y-1.5">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{template.name}</p>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
          {active > 0 && (
            <Pill tone="green">
              {active} {active === 1 ? 'proyecto activo' : 'proyectos activos'}
            </Pill>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {template.stages.map((s, i) => (
              <React.Fragment key={s}>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {s}
                </span>
                {i < template.stages.length - 1 && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Próximamente"
          className="h-7 rounded-md px-3 text-xs font-medium"
        >
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Próximamente"
          className="h-7 rounded-md px-3 text-xs font-medium"
        >
          Duplicar
        </Button>
        {/* Sólo se puede borrar una plantilla que ningún proyecto esté usando. */}
        {active === 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Próximamente"
            className="h-7 rounded-md border-red-500 px-3 text-xs font-medium text-red-600 dark:text-red-400"
          >
            ✕ Borrar
          </Button>
        )}
      </div>
    </SettingsCard>
  );
}

export function TemplatesTab() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Plantillas de pipeline"
        description="Define los pasos que sigue cada tipo de proyecto."
        action={
          <Button
            disabled
            title="Próximamente"
            className="h-8.5 shrink-0 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            + Nueva plantilla
          </Button>
        }
      />

      <div className="space-y-4">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
