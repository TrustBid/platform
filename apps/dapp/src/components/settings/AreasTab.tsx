'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAreas, type Area, type AreaInput } from '@/hooks/useSettingsResources';
import { useOrgUsers } from '@/hooks/useOrg';
import { AreaDialog } from './AreaDialog';
import { SectionHeader, SettingsCard } from './shared';

/** Por encima de este % de ejecución se avisa que el presupuesto se agota. */
const ALERT_THRESHOLD = 85;

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

function AreaCard({
  area,
  canManage,
  onEdit,
  onDelete,
}: {
  area: Area;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Un área sin presupuesto asignado se muestra en 0%, no como NaN.
  const pct =
    area.budgetAmount > 0
      ? Math.round((area.spentAmount / area.budgetAmount) * 100)
      : 0;
  const nearLimit = pct >= ALERT_THRESHOLD;

  return (
    <SettingsCard className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 shrink-0 rounded-lg bg-[#dee8fc] dark:bg-blue-950/60" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{area.name}</p>
          {area.description && (
            <p className="text-[11px] text-muted-foreground">{area.description}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {area.responsableName
              ? `Responsable: ${area.responsableName}`
              : 'Sin responsable asignado'}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-y border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Presupuesto asignado
          </span>
          <span className="text-xs font-semibold text-foreground">
            {money(area.budgetAmount)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${nearLimit ? 'bg-red-600' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Ejecutado: {money(area.spentAmount)}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              nearLimit
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        {canManage && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-7 rounded-md px-4 text-xs font-medium"
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-7 rounded-md border-red-500 px-3 text-xs font-medium text-red-600 dark:text-red-400"
            >
              Borrar
            </Button>
          </>
        )}
        {nearLimit && (
          <span className="inline-flex items-center rounded-md border border-red-600 bg-[#fee9e8] px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
            ⚠ Alerta: presupuesto casi agotado
          </span>
        )}
      </div>
    </SettingsCard>
  );
}

export function AreasTab({ isAdmin }: { isAdmin: boolean }) {
  const { areas, loading, create, update, remove } = useAreas();
  const { users } = useOrgUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (area: Area) => {
    setEditing(area);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: AreaInput) =>
    editing ? update(editing.id, input) : create(input);

  const handleDelete = async (area: Area) => {
    setError(null);
    const ok = await remove(area.id);
    if (!ok) setError(`No se pudo borrar el área "${area.name}".`);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Áreas"
        description="Los gastos confirmados de cada área alimentan su ejecución."
        action={
          isAdmin ? (
            <Button
              onClick={openNew}
              className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              + Nueva área
            </Button>
          ) : undefined
        }
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : areas.length === 0 ? (
        <SettingsCard>
          <p className="p-8 text-center text-sm text-muted-foreground">
            Todavía no hay áreas.
            {isAdmin && ' Creá la primera para repartir el presupuesto.'}
          </p>
        </SettingsCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {areas.map((a) => (
            <AreaCard
              key={a.id}
              area={a}
              canManage={isAdmin}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a)}
            />
          ))}
        </div>
      )}

      <AreaDialog
        open={dialogOpen}
        area={editing}
        users={users}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
