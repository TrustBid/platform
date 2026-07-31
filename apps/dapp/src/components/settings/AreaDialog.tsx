'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Area, AreaInput } from '@/hooks/useSettingsResources';
import type { OrgUser } from '@/hooks/useOrg';
import { FieldLabel } from './shared';

/** Diálogo de alta y edición de área. `area` en `null` significa alta. */
export function AreaDialog({
  open,
  area,
  users,
  onClose,
  onSubmit,
}: {
  open: boolean;
  area: Area | null;
  users: OrgUser[];
  onClose: () => void;
  onSubmit: (input: AreaInput) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rellena el formulario cada vez que se abre, desde el área que toque.
  const [lastOpenedFor, setLastOpenedFor] = useState<string | null>(null);
  const openKey = open ? (area?.id ?? 'new') : null;
  if (openKey !== lastOpenedFor) {
    setLastOpenedFor(openKey);
    setName(area?.name ?? '');
    setDescription(area?.description ?? '');
    setBudget(area ? String(area.budgetAmount) : '');
    setResponsableId(area?.responsableId ?? '');
    setError(null);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    const parsedBudget = budget.trim() === '' ? 0 : Number(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      setError('El presupuesto debe ser un número mayor o igual a cero.');
      return;
    }

    setSaving(true);
    setError(null);
    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      budgetAmount: parsedBudget,
      responsableId: responsableId || null,
    });
    setSaving(false);
    if (ok) onClose();
    else setError('No se pudo guardar el área.');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{area ? 'Editar área' : 'Nueva área'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="area-name">Nombre</FieldLabel>
            <Input
              id="area-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Obras"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="area-desc">Descripción</FieldLabel>
            <Textarea
              id="area-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proyectos de infraestructura y construcción."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="area-budget">Presupuesto asignado</FieldLabel>
              <Input
                id="area-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="area-resp">Responsable</FieldLabel>
              <select
                id="area-resp"
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
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
            {saving ? 'Guardando…' : area ? 'Guardar cambios' : 'Crear área'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
