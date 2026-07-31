'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  usePipelineTemplates,
  type PipelineTemplate,
  type TemplateInput,
} from '@/hooks/useSettingsResources';
import { TemplateDialog } from './TemplateDialog';
import { Pill, SectionHeader, SettingsCard } from './shared';

function TemplateCard({
  template,
  canManage,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: PipelineTemplate;
  canManage: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const active = template.activeProjects;

  return (
    <SettingsCard>
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 shrink-0 rounded-lg bg-[#dee8fc] dark:bg-blue-950/60" />
        <div className="min-w-0 space-y-1.5">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{template.name}</p>
            {template.description && (
              <p className="text-xs text-muted-foreground">{template.description}</p>
            )}
          </div>
          {active > 0 && (
            <Pill tone="green">
              {active} {active === 1 ? 'proyecto activo' : 'proyectos activos'}
            </Pill>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {template.stages.map((s, i) => (
              <React.Fragment key={`${s.name}-${i}`}>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {s.name}
                </span>
                {i < template.stages.length - 1 && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-7 rounded-md px-3 text-xs font-medium"
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="h-7 rounded-md px-3 text-xs font-medium"
          >
            Duplicar
          </Button>
          {/* Sólo se puede borrar una plantilla que ningún proyecto activo use.
              El backend lo vuelve a validar y responde 409 si cambió. */}
          {active === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-7 rounded-md border-red-500 px-3 text-xs font-medium text-red-600 dark:text-red-400"
            >
              ✕ Borrar
            </Button>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

export function TemplatesTab({ isAdmin }: { isAdmin: boolean }) {
  const { templates, loading, create, update, duplicate, remove } =
    usePipelineTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (t: PipelineTemplate) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: TemplateInput) =>
    editing ? update(editing.id, input) : create(input);

  const handleDelete = async (t: PipelineTemplate) => {
    setError(null);
    const ok = await remove(t.id);
    if (!ok) setError(`No se pudo borrar "${t.name}": puede estar en uso.`);
  };

  const handleDuplicate = async (t: PipelineTemplate) => {
    setError(null);
    const ok = await duplicate(t.id);
    if (!ok) setError(`No se pudo duplicar "${t.name}".`);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Plantillas de pipeline"
        description="Define los pasos que sigue cada tipo de proyecto."
        action={
          isAdmin ? (
            <Button
              onClick={openNew}
              className="h-8.5 shrink-0 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              + Nueva plantilla
            </Button>
          ) : undefined
        }
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <SettingsCard>
          <p className="p-8 text-center text-sm text-muted-foreground">
            Todavía no hay plantillas.
            {isAdmin && ' Creá una para reutilizar el mismo flujo en varios proyectos.'}
          </p>
        </SettingsCard>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              canManage={isAdmin}
              onEdit={() => openEdit(t)}
              onDuplicate={() => handleDuplicate(t)}
              onDelete={() => handleDelete(t)}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        open={dialogOpen}
        template={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
