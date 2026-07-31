'use client';

import React from 'react';
import { useOrgUsers, type OrgUser } from '@/hooks/useOrg';
import { ROLE_LABELS, ROLE_PERMISSIONS } from './roles';
import { Pill, SectionHeader, SettingsCard, SettingsCardHeader, StatusDot } from './shared';

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

function UserRow({ user }: { user: OrgUser }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edf1fe] text-[10px] font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
        {initialsOf(user.name)}
      </div>

      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
        {user.name}
      </span>

      <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block">
        {user.email ?? '—'}
      </span>

      <span className="w-28 shrink-0">
        <Pill tone="blue">{ROLE_LABELS[user.role] ?? user.role}</Pill>
      </span>

      {/* El diseño muestra "Invitado" para una invitación pendiente, pero la
          API sólo expone `isActive`: un usuario desactivado no es un invitado,
          así que lo etiquetamos por lo que el dato realmente significa. */}
      <span className="hidden w-24 shrink-0 items-center gap-1.5 md:flex">
        <StatusDot className={user.isActive ? 'bg-emerald-500' : 'bg-zinc-400'} />
        <span
          className={`text-xs ${user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
        >
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </span>
    </div>
  );
}

export function UsersTab() {
  const { users, loading } = useOrgUsers();

  return (
    <div className="space-y-4">
      <SectionHeader title="Usuarios y roles" />

      <SettingsCard className="overflow-hidden">
        {/* Cabecera de tabla */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-7 shrink-0" />
          <span className="flex-1">Nombre</span>
          <span className="hidden flex-1 sm:block">Correo</span>
          <span className="w-28 shrink-0">Rol</span>
          <span className="hidden w-24 shrink-0 md:block">Estado</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay usuarios en tu organización aún.
          </p>
        ) : (
          users.map((u) => <UserRow key={u.id} user={u} />)
        )}
      </SettingsCard>

      {/* El diseño incluye "+ Invitar usuario" y "Editar", pero la API sólo
          expone GET /my/org/users: no hay endpoint de invitación por correo ni
          de cambio de rol. Se omiten hasta que existan. */}

      <SettingsCard>
        <SettingsCardHeader title="Permisos por rol" />
        {ROLE_PERMISSIONS.map((p) => (
          <div
            key={p.role}
            className="flex flex-col gap-0.5 border-b border-border/60 px-4 py-2.5 last:border-0 sm:flex-row sm:gap-4"
          >
            <span className="w-40 shrink-0 text-xs font-semibold text-foreground">
              {p.role}
            </span>
            <span className="text-xs text-muted-foreground">{p.detail}</span>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}
