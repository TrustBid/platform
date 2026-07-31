'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PipelineTemplate, TemplateInput } from '@/hooks/useSettingsResources';
import { FieldLabel } from './shared';

/** Diálogo de alta y edición de plantilla. `template` en `null` es alta. */
export function TemplateDialog({
  open,
  template,
  onClose,
  onSubmit,
}: {
  open: boolean;
  template: PipelineTemplate | null;
  onClose: () => void;
  onSubmit: (input: TemplateInput) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rellena el formulario cada vez que se abre, desde la plantilla que toque.
  const [lastOpenedFor, setLastOpenedFor] = useState<string | null>(null);
  const openKey = open ? (template?.id ?? 'new') : null;
  if (openKey !== lastOpenedFor) {
    setLastOpenedFor(openKey);
    setName(template?.name ?? '');
    setDescription(template?.description ?? '');
    setStages(template?.stages.map((s) => s.name) ?? ['']);
    setError(null);
  }

  const setStage = (i: number, value: string) =>
    setStages((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  const addStage = () => setStages((prev) => [...prev, '']);
  const removeStage = (i: number) =>
    setStages((prev) => prev.filter((_, idx) => idx !== i));

  async function handleSubmit() {
    const cleanStages = stages.map((s) => s.trim()).filter(Boolean);
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (cleanStages.length === 0) {
      setError('La plantilla necesita al menos una etapa.');
      return;
    }

    setSaving(true);
    setError(null);
    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      stages: cleanStages.map((s) => ({ name: s })),
    });
    setSaving(false);
    if (ok) onClose();
    else setError('No se pudo guardar la plantilla.');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="tpl-name">Nombre</FieldLabel>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Construcción"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="tpl-desc">Descripción</FieldLabel>
            <Input
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flujo estándar para proyectos de obra."
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Etapas (en orden)</FieldLabel>
            {stages.map((stage, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <Input
                  value={stage}
                  onChange={(e) => setStage(i, e.target.value)}
                  placeholder="Diseño"
                  aria-label={`Etapa ${i + 1}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeStage(i)}
                  disabled={stages.length === 1}
                  aria-label={`Quitar etapa ${i + 1}`}
                  className="h-8 shrink-0 px-2 text-xs"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addStage}
              className="h-7 px-3 text-xs"
            >
              + Agregar etapa
            </Button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? 'Guardando…' : template ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
