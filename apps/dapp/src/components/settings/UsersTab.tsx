'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useOrgUsers, type OrgUser } from '@/hooks/useOrg';
import { updateOrgUser, useInvites } from '@/hooks/useSettingsResources';
import { Input } from '@/components/ui/input';
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from './roles';
import { FieldLabel, Pill, SectionHeader, SettingsCard, SettingsCardHeader, StatusDot } from './shared';

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

function UserRow({
  user,
  canManage,
  onEdit,
}: {
  user: OrgUser;
  canManage: boolean;
  onEdit: () => void;
}) {
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

      {/* `isActive` significa desactivado, no "invitado": la API no expone un
          estado de invitación pendiente como el que dibuja el diseño. */}
      <span className="hidden w-24 shrink-0 items-center gap-1.5 md:flex">
        <StatusDot className={user.isActive ? 'bg-emerald-500' : 'bg-zinc-400'} />
        <span
          className={`text-xs ${user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
        >
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </span>

      {canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-6 shrink-0 rounded-md px-2 text-[11px] font-medium"
        >
          Editar
        </Button>
      )}
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: OrgUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastUserId, setLastUserId] = useState<string | null>(null);
  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setRole(user.role);
    setIsActive(user.isActive);
    setError(null);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const res = await updateOrgUser(user.id, { role, isActive });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      // El backend rechaza degradar al último admin o modificarse a uno mismo.
      setError(res.message ?? 'No se pudieron guardar los cambios.');
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {user?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="user-role">Rol</FieldLabel>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-foreground">Cuenta activa</p>
              <p className="text-xs text-muted-foreground">
                Al desactivarla, la persona pierde el acceso.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Cuenta activa"
              className="data-checked:bg-blue-600"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('responsable');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setEmail(''); setRole('responsable'); setError(null); }
  }

  async function handleInvite() {
    setSaving(true);
    setError(null);
    const res = await onInvite(email.trim(), role);
    setSaving(false);
    if (res.ok) onClose();
    else setError(res.message ?? 'No se pudo crear la invitación.');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="invite-email">Correo electrónico</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@organizacion.org"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="invite-role">Rol</FieldLabel>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {/* Sin SMTP conectado no se envía el correo: la invitación se
              comparte pasando el enlace que queda en el listado. */}
          <p className="text-xs text-muted-foreground">
            Se generará un enlace de alta. El envío por correo requiere conectar
            Email / SMTP en Integraciones.
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleInvite}
            disabled={saving || !email.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? 'Creando…' : 'Crear invitación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const { users, loading, refetch } = useOrgUsers();
  const { invites, create, revoke } = useInvites(isAdmin);
  const [editing, setEditing] = useState<OrgUser | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Usuarios y roles"
        action={
          isAdmin ? (
            <Button
              onClick={() => setInviteOpen(true)}
              className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              + Invitar usuario
            </Button>
          ) : undefined
        }
      />

      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500 bg-[#fff5e3] px-3 py-2.5 dark:bg-amber-950/30"
        >
          <span className="text-xs text-amber-800 dark:text-amber-300">
            ⏳ Invitación pendiente — {inv.email} · {ROLE_LABELS[inv.role] ?? inv.role}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(inv.inviteUrl);
                setCopied(inv.id);
              }}
              className="h-6 rounded-md border-amber-500 px-2 text-[11px]"
            >
              {copied === inv.id ? 'Copiado' : 'Copiar enlace'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => revoke(inv.id)}
              className="h-6 rounded-md border-amber-500 px-2 text-[11px]"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ))}

      <SettingsCard className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-7 shrink-0" />
          <span className="flex-1">Nombre</span>
          <span className="hidden flex-1 sm:block">Correo</span>
          <span className="w-28 shrink-0">Rol</span>
          <span className="hidden w-24 shrink-0 md:block">Estado</span>
          {isAdmin && <span className="w-[52px] shrink-0" />}
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
          users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              canManage={isAdmin}
              onEdit={() => setEditing(u)}
            />
          ))
        )}
      </SettingsCard>

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

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={create}
      />
    </div>
  );
}
