'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrgBadges } from '@/components/blockchain/OrgBadges';
import { authHeaders, clearJwt } from '@/lib/auth/sep10';
import { COUNTRIES, countryName } from '@/lib/countries';
import { API_BASE_URL as API } from '@/lib/api/base-url';
import type { CurrentUser } from '@/hooks/useCurrentUser';
import type { Organization } from '@/hooks/useOrg';
import {
  GEO_SCOPES,
  LANGUAGES,
  ORG_TYPES,
  TIMEZONES,
  type OrgProfile,
} from '@/hooks/useOrgProfile';
import { uploadImage } from '@/hooks/useSettingsResources';
import { ROLE_LABELS } from './roles';
import {
  FieldLabel,
  SettingsCard,
  SettingsCardHeader,
  StatusDot,
} from './shared';

const INPUT = 'h-9 rounded-md text-[13px]';
const INPUT_RO = `${INPUT} bg-muted/60 text-muted-foreground cursor-not-allowed`;
const SELECT =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground';

/**
 * Campos editables.
 *
 * `name` y `phone` viajan a `PATCH /auth/me`; `orgName` y `country` a
 * `PATCH /my/org` —que normaliza el país a mayúsculas, requisito del CHECK de
 * la tabla `organizations`—; el resto a `PATCH /my/org/profile`. No hay más
 * campos porque no hay más columnas: misión, logo, zona horaria e idioma no
 * existen en la base.
 */
type Field =
  | 'name'
  | 'phone'
  | 'orgName'
  | 'country'
  | 'legal_name'
  | 'fiscal_id'
  | 'org_type'
  | 'website'
  | 'orgPhone'
  | 'geographic_scope'
  | 'mission'
  | 'timezone'
  | 'language';

export function GeneralTab({
  user,
  org,
  profile,
  onSaved,
}: {
  user: CurrentUser | null;
  org: Organization | null;
  profile: OrgProfile | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  // `user`, `org` y `profile` llegan async. En vez de copiarlos a estado dentro
  // de un efecto, guardamos sólo los campos que el usuario tocó (ausente =
  // intacto) y derivamos el resto de los props.
  const [edits, setEdits] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  // Las imágenes se suben al instante, aparte del botón "Guardar cambios":
  // son un endpoint distinto (multipart) y no forman parte del formulario.
  const [uploading, setUploading] = useState<'logo' | 'avatar' | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const setField = (field: Field) => (value: string) => {
    setEdits((e) => ({ ...e, [field]: value }));
    setSavedMsg(null);
  };

  const name = edits.name ?? user?.name ?? '';
  const phone = edits.phone ?? user?.phone ?? '';
  const orgName = edits.orgName ?? org?.name ?? '';
  const country = edits.country ?? org?.country ?? '';
  const legalName = edits.legal_name ?? profile?.legal_name ?? '';
  const fiscalId = edits.fiscal_id ?? profile?.fiscal_id ?? '';
  const orgType = edits.org_type ?? profile?.org_type ?? '';
  const website = edits.website ?? profile?.website ?? '';
  const orgPhone = edits.orgPhone ?? profile?.phone ?? '';
  const geoScope = edits.geographic_scope ?? profile?.geographic_scope ?? '';
  const mission = edits.mission ?? profile?.mission ?? '';
  const timezone = edits.timezone ?? profile?.timezone ?? 'America/Bogota';
  const language = edits.language ?? profile?.language ?? 'es';

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
      if (!meRes.ok) throw new Error('perfil');

      if (isAdmin && org) {
        const orgRes = await fetch(`${API}/my/org`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ name: orgName.trim(), country }),
        });
        if (!orgRes.ok) throw new Error('organización');

        // El DTO ignora las claves ausentes, así que sólo mandamos lo que se
        // tocó: string vacío es un borrado intencional, ausente es "no tocar".
        const profileBody: Record<string, string> = {};
        if (edits.legal_name !== undefined) profileBody.legal_name = legalName.trim();
        if (edits.fiscal_id !== undefined) profileBody.fiscal_id = fiscalId.trim();
        if (edits.org_type !== undefined) profileBody.org_type = orgType;
        if (edits.website !== undefined) profileBody.website = website.trim();
        if (edits.orgPhone !== undefined) profileBody.phone = orgPhone.trim();
        if (edits.geographic_scope !== undefined)
          profileBody.geographic_scope = geoScope;
        if (edits.mission !== undefined) profileBody.mission = mission.trim();
        if (edits.timezone !== undefined) profileBody.timezone = timezone;
        if (edits.language !== undefined) profileBody.language = language;

        if (Object.keys(profileBody).length > 0) {
          const profRes = await fetch(`${API}/my/org/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(profileBody),
          });
          if (!profRes.ok) throw new Error('perfil de la organización');
        }
      }

      onSaved?.();
      // Soltamos las ediciones locales para volver a derivar de los props ya
      // refrescados: si no, el input seguiría mostrando el texto sin recortar
      // mientras el servidor guardó la versión con `trim()`.
      setEdits({});
      setSavedMsg('Cambios guardados.');
    } catch (err) {
      const what = err instanceof Error ? err.message : '';
      setSaveErr(`No se pudieron guardar los cambios${what ? ` (${what})` : ''}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(target: 'logo' | 'avatar', file?: File) {
    if (!file) return;
    setUploading(target);
    setSaveErr(null);
    const res = await uploadImage(target, file);
    setUploading(null);
    if (!res.ok) {
      setSaveErr(res.message ?? 'No se pudo subir la imagen.');
      return;
    }
    if (target === 'avatar') setAvatarUrl(res.url ?? null);
    else setLogoUrl(res.url ?? null);
    onSaved?.();
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
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="bg-[#edf1fe] text-[15px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{name || '—'}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInput.current?.click()}
                disabled={uploading === 'avatar'}
                className="h-6 rounded-md px-2 text-[10px] font-medium"
              >
                {uploading === 'avatar' ? 'Subiendo…' : 'Cambiar'}
              </Button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleUpload('avatar', e.target.files?.[0])}
              />
            </div>
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
            {(logoUrl ?? profile?.logo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl ?? profile?.logo_url ?? ''}
                alt="Logo de la organización"
                className="size-16 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="size-16 shrink-0 rounded-lg border border-border bg-muted/60" />
            )}
            <div className="space-y-1.5">
              <FieldLabel>Logo de la organización</FieldLabel>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoInput.current?.click()}
                disabled={!isAdmin || uploading === 'logo'}
                className="h-7 rounded-md px-2.5 text-xs font-medium"
              >
                {uploading === 'logo' ? 'Subiendo…' : '↑ Subir imagen'}
              </Button>
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleUpload('logo', e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="orgName">Nombre de la organización</FieldLabel>
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
                  className={SELECT}
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
                <Input value={countryName(country)} disabled className={INPUT_RO} />
              )}
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="orgType">Tipo de organización</FieldLabel>
              <select
                id="orgType"
                value={orgType}
                onChange={(e) => setField('org_type')(e.target.value)}
                disabled={!isAdmin}
                className={SELECT}
              >
                <option value="">Sin especificar</option>
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="legalName">Razón social</FieldLabel>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setField('legal_name')(e.target.value)}
                disabled={!isAdmin}
                className={isAdmin ? INPUT : INPUT_RO}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="fiscalId">Identificación fiscal</FieldLabel>
              <Input
                id="fiscalId"
                value={fiscalId}
                onChange={(e) => setField('fiscal_id')(e.target.value)}
                disabled={!isAdmin}
                className={isAdmin ? INPUT : INPUT_RO}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="geoScope">Alcance geográfico</FieldLabel>
              <select
                id="geoScope"
                value={geoScope}
                onChange={(e) => setField('geographic_scope')(e.target.value)}
                disabled={!isAdmin}
                className={SELECT}
              >
                <option value="">Sin especificar</option>
                {GEO_SCOPES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="website">Sitio web</FieldLabel>
              <Input
                id="website"
                value={website}
                onChange={(e) => setField('website')(e.target.value)}
                placeholder="https://…"
                disabled={!isAdmin}
                className={isAdmin ? INPUT : INPUT_RO}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="orgPhone">Teléfono de contacto</FieldLabel>
              <Input
                id="orgPhone"
                value={orgPhone}
                onChange={(e) => setField('orgPhone')(e.target.value)}
                disabled={!isAdmin}
                className={isAdmin ? INPUT : INPUT_RO}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="mission">Misión (opcional)</FieldLabel>
            <Textarea
              id="mission"
              value={mission}
              onChange={(e) => setField('mission')(e.target.value)}
              placeholder="Transparencia financiera para fundaciones sociales…"
              rows={2}
              disabled={!isAdmin}
            />
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
            <select
              id="tz"
              value={timezone}
              onChange={(e) => setField('timezone')(e.target.value)}
              disabled={!isAdmin}
              className={SELECT}
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="lang">Idioma</FieldLabel>
            <select
              id="lang"
              value={language}
              onChange={(e) => setField('language')(e.target.value)}
              disabled={!isAdmin}
              className={SELECT}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
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
          <span className="text-sm text-red-600 dark:text-red-400">{saveErr}</span>
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
