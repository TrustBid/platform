'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OrgBadges } from '@/components/blockchain/OrgBadges';
import { authHeaders, clearJwt } from '@/lib/auth/sep10';
import { COUNTRIES, countryName } from '@/lib/countries';
import { API_BASE_URL as API } from '@/lib/api/base-url';
import type { CurrentUser } from '@/hooks/useCurrentUser';
import type { Organization } from '@/hooks/useOrg';
import { ROLE_LABELS } from './roles';
import {
  FieldLabel,
  SettingsCard,
  SettingsCardHeader,
  StatusDot,
} from './shared';

const INPUT = 'h-9 rounded-md text-[13px]';
const INPUT_RO = `${INPUT} bg-muted/60 text-muted-foreground cursor-not-allowed`;

/** Campos editables del formulario. */
type Field = 'name' | 'phone' | 'orgName' | 'country';

export function GeneralTab({
  user,
  org,
  onOrgSaved,
}: {
  user: CurrentUser | null;
  org: Organization | null;
  onOrgSaved?: () => void;
}) {
  const router = useRouter();
  // `user` y `org` llegan async. En vez de copiarlos a estado dentro de un
  // efecto, guardamos sólo los campos que el usuario tocó (ausente = intacto)
  // y derivamos el resto del prop.
  const [edits, setEdits] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const setField = (field: Field) => (value: string) =>
    setEdits((e) => ({ ...e, [field]: value }));

  const name = edits.name ?? user?.name ?? '';
  const phone = edits.phone ?? user?.phone ?? '';
  const orgName = edits.orgName ?? org?.name ?? '';
  const country = edits.country ?? org?.country ?? '';

  const isWalletUser = !!user?.walletAddress;
  const isAdmin = user?.role === 'admin';
  const displayEmail = user?.walletAddress ?? user?.email ?? '';
  const initials =
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  async function handleSave() {
    if (!name.trim()) {
      setSaveErr('El nombre no puede estar vacío.');
      return;
    }
    setSaving(true);
    setSavedMsg(null);
    setSaveErr(null);
    try {
      const meRes = await fetch(`${API}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      if (!meRes.ok) throw new Error('me');

      if (isAdmin && org) {
        const orgRes = await fetch(`${API}/my/org`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ name: orgName.trim(), country }),
        });
        if (!orgRes.ok) throw new Error('org');
        onOrgSaved?.();
      }
      // Dejamos en pantalla exactamente lo que se persistió: si no, el input
      // seguiría mostrando el texto sin recortar mientras el servidor ya
      // guardó la versión con `trim()`.
      setEdits((e) => ({ ...e, name: name.trim(), orgName: orgName.trim() }));
      setSavedMsg('Cambios guardados.');
    } catch {
      setSaveErr('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    clearJwt();
    router.push('/login');
  }

  return (
    <div className="space-y-4">
      {/* Perfil */}
      <SettingsCard>
        <SettingsCardHeader title="Perfil" />
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-[#edf1fe] text-[15px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Próximamente"
              className="h-6 rounded-md px-2 text-[10px] font-medium"
            >
              Cambiar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setField('name')(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setField('phone')(e.target.value)}
                placeholder="+__ ___ ___ ____"
                className={INPUT}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="role">Rol</FieldLabel>
              <Input
                id="role"
                value={ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''}
                disabled
                className={INPUT_RO}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel htmlFor="email">
                {isWalletUser ? 'Cuenta de acceso' : 'Correo electrónico'}
              </FieldLabel>
              <Input
                id="email"
                value={displayEmail}
                disabled
                className={`${INPUT_RO} ${isWalletUser ? 'font-mono text-xs' : ''}`}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Seguridad */}
      <SettingsCard>
        <SettingsCardHeader
          title="Seguridad"
          description="Gestión de tu sesión activa."
        />
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <StatusDot className="bg-emerald-500" />
            <span className="text-[13px] text-foreground">
              Sesión activa — autenticada correctamente
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="h-7 rounded-lg px-3 text-xs font-semibold"
          >
            Cerrar sesión
          </Button>
        </div>
      </SettingsCard>

      {/* Organización */}
      <SettingsCard>
        <SettingsCardHeader
          title="Organización"
          description={
            isAdmin
              ? 'Datos de tu organización en TrustBid.'
              : 'Solo un administrador puede editar estos datos.'
          }
        />
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="size-16 shrink-0 rounded-lg border border-border bg-muted/60" />
            <div className="space-y-1.5">
              <FieldLabel>Logo de la organización</FieldLabel>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Próximamente"
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                ↑ Subir imagen
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="orgName">
                Nombre de la organización
              </FieldLabel>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setField('orgName')(e.target.value)}
                disabled={!isAdmin}
                className={isAdmin ? INPUT : INPUT_RO}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="country">País</FieldLabel>
              {isAdmin ? (
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setField('country')(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>
                    Selecciona un país
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={countryName(country)}
                  disabled
                  className={INPUT_RO}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="mission">Misión (opcional)</FieldLabel>
              <Input
                id="mission"
                disabled
                title="Próximamente"
                placeholder="Transparencia financiera…"
                className={INPUT_RO}
              />
            </div>
          </div>

          {org?.id && (
            <div className="border-t border-border pt-4">
              <OrgBadges organizationId={org.id} />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Preferencias */}
      <SettingsCard>
        <SettingsCardHeader
          title="Preferencias"
          description="Idioma y zona horaria."
        />
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="tz">Zona horaria</FieldLabel>
            <Input
              id="tz"
              disabled
              title="Próximamente"
              value="América/Bogotá (UTC-5)"
              readOnly
              className={INPUT_RO}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="lang">Idioma</FieldLabel>
            <Input
              id="lang"
              disabled
              title="Próximamente"
              value="Español"
              readOnly
              className={INPUT_RO}
            />
          </div>
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end gap-3">
        {savedMsg && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            {savedMsg}
          </span>
        )}
        {saveErr && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {saveErr}
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="h-8.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
