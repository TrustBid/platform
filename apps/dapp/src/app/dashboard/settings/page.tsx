'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/ui/mode-toggle';
import {
  Shield,
  User,
  Mail,
  Plus,
  CheckCircle2,
  Building2,
  Workflow,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser, type CurrentUser } from '@/hooks/useCurrentUser';
import { useOrg, useOrgUsers, type Organization } from '@/hooks/useOrg';
import { authHeaders } from '@/lib/auth/sep10';
import { COUNTRIES, countryName } from '@/lib/countries';
import { OrgBadges } from '@/components/blockchain/OrgBadges';

import { API_BASE_URL as API } from '@/lib/api/base-url';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  responsable: 'Responsable',
  donante: 'Donante',
};

// --- Datos locales de pestañas aún sin backend (Áreas / Pipeline / Integraciones) ---
const AREAS = [
  { id: 'a1', name: 'Obras', description: 'Proyectos de infraestructura y construcción.', members: 3 },
  { id: 'a2', name: 'Educación', description: 'Programas educativos y becas.', members: 2 },
  { id: 'a3', name: 'Salud', description: 'Brigadas y atención médica.', members: 2 },
  { id: 'a4', name: 'Administración', description: 'Finanzas, contabilidad y reportería.', members: 4 },
];

const PIPELINE_TEMPLATES = [
  { id: 'p1', name: 'Construcción', description: 'Flujo estándar para proyectos de obra.', stages: ['Diseño', 'Fondeo', 'Ejecución', 'Verificación', 'Cierre'] },
  { id: 'p2', name: 'Donación simple', description: 'Recepción y ejecución directa de fondos.', stages: ['Fondeo', 'Ejecución', 'Cierre'] },
  { id: 'p3', name: 'Programa por hitos', description: 'Desembolsos atados a hitos verificados.', stages: ['Planificación', 'Hito 1', 'Hito 2', 'Hito 3', 'Cierre'] },
];


const TABS = [
  { id: 'general', label: 'General' },
  { id: 'users', label: 'Usuarios y roles' },
  { id: 'areas', label: 'Áreas' },
  { id: 'pipeline', label: 'Plantillas de pipeline' },
  { id: 'integrations', label: 'Integraciones' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('general');
  const { user } = useCurrentUser();
  const { org, refetch: refetchOrg } = useOrg();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100">

      {/* Header Principal */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Gestiona tu cuenta, equipo y preferencias de la plataforma.</p>
        </div>
        <ModeToggle />
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab user={user} org={org} onOrgSaved={refetchOrg} />}
      {tab === 'users' && <UsersTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'integrations' && <IntegrationsTab />}
    </div>
  );
}

/* ---------- GENERAL ---------- */
function GeneralTab({
  user,
  org,
  onOrgSaved,
}: {
  user: CurrentUser | null;
  org: Organization | null;
  onOrgSaved?: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // Los datos llegan async; sincronizamos los inputs cuando aparecen.
  useEffect(() => {
    if (user) { setName(user.name ?? ''); setPhone(user.phone ?? ''); }
  }, [user]);
  useEffect(() => {
    if (org) { setOrgName(org.name ?? ''); setCountry(org.country ?? ''); }
  }, [org]);

  const isWalletUser = !!user?.walletAddress;
  const isAdmin = user?.role === 'admin';
  const displayEmail = user?.walletAddress ?? user?.email ?? '';
  const initials =
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  async function handleSave() {
    if (!name.trim()) { setSaveErr('El nombre no puede estar vacío.'); return; }
    setSaving(true); setSavedMsg(null); setSaveErr(null);
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
      setSavedMsg('Cambios guardados.');
    } catch {
      setSaveErr('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Perfil */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Información del Perfil</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">Tus datos de identidad dentro de la plataforma.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4 bg-zinc-100/60 border border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800/40 p-4 rounded-xl">
            <Avatar className="h-14 w-14 border border-zinc-300 dark:border-zinc-700/50">
              <AvatarFallback className="bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{name || '—'}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-500">{ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre completo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700 focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {isWalletUser ? 'Wallet Stellar' : 'Correo electrónico'}
              </label>
              <Input
                value={displayEmail}
                disabled
                className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+__ ___ ___ ____"
                className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Rol</label>
              <Input value={ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''} disabled className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organización */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Organización</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              {isAdmin ? 'Datos de tu organización en TrustBid.' : 'Solo un administrador puede editar estos datos.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre de la organización</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isAdmin}
                className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 disabled:bg-zinc-100 disabled:text-zinc-500 dark:disabled:bg-zinc-900/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">País</label>
              {isAdmin ? (
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-white border border-zinc-300 text-zinc-900 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="" disabled>Selecciona un país</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <Input value={countryName(country)} disabled className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed" />
              )}
            </div>
          </div>
          {org?.id && (
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <OrgBadges organizationId={org.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceso */}
      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
          <div className="p-2 bg-zinc-100 text-amber-600 dark:bg-zinc-900 dark:text-amber-500 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Seguridad de Acceso</CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              {isWalletUser
                ? 'Tu cuenta está protegida por firma criptográfica SEP-10.'
                : 'Gestiona tu contraseña de acceso.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isWalletUser ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Autenticación por wallet Stellar activa — no se requiere contraseña.
            </div>
          ) : (
            <Button variant="outline" className="h-9 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Cambiar Contraseña
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        {savedMsg && <span className="text-sm text-emerald-600 dark:text-emerald-400">{savedMsg}</span>}
        {saveErr && <span className="text-sm text-red-600 dark:text-red-400">{saveErr}</span>}
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- USUARIOS Y ROLES ---------- */
function UsersTab() {
  const { users, loading } = useOrgUsers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Usuarios y roles</h2>
        <Button
          disabled
          title="Disponible próximamente"
          className="bg-blue-600 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="h-4 w-4" />
          Invitar usuario
        </Button>
      </div>

      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 py-12 text-center">No hay usuarios en tu organización aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Último ingreso'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-200/70 last:border-0 dark:border-zinc-800/60">
                    <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</td>
                    <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400">{u.email ?? '—'}</td>
                    <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                      }`}>
                        <CheckCircle2 className="h-3 w-3" />
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('es-CO') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- ÁREAS ---------- */
function AreasTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Áreas</h2>
        <Button
          disabled
          title="Próximamente"
          className="bg-blue-600 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Nueva área
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AREAS.map((a) => (
          <Card key={a.id} className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-900 dark:text-white">{a.name}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{a.description}</p>
                  <p className="text-xs text-zinc-500 pt-1">{a.members} miembros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- PLANTILLAS DE PIPELINE ---------- */
function PipelineTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Plantillas de pipeline</h2>
        <Button
          disabled
          title="Próximamente"
          className="bg-blue-600 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      <div className="space-y-4">
        {PIPELINE_TEMPLATES.map((p) => (
          <Card key={p.id} className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
                  <Workflow className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{p.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.stages.map((s, i) => (
                      <React.Fragment key={s}>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          {s}
                        </span>
                        {i < p.stages.length - 1 && <span className="text-zinc-400">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- INTEGRACIONES ---------- */
type IntegrationItem = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  detail: string | null;
  walletAddress: string | null;
};

function IntegrationsTab() {
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/my/org/settings/integrations`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setItems)
      .catch(() => {
        // Fallback a datos estáticos si el endpoint falla
        setItems([
          { id: 'stellar', name: 'Stellar Testnet', description: 'Red de pruebas para anclaje on-chain.', connected: false, detail: 'No disponible', walletAddress: null },
          { id: 'usdc', name: 'USDC', description: 'Stablecoin para fondeo y desembolsos.', connected: false, detail: null, walletAddress: null },
          { id: 'email', name: 'Email / SMTP', description: 'Notificaciones por correo a donantes.', connected: false, detail: null, walletAddress: null },
          { id: 'whatsapp', name: 'WhatsApp API', description: 'Avisos y reportes por WhatsApp.', connected: false, detail: null, walletAddress: null },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Integraciones</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id} className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
                    <Plug className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{it.name}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{it.description}</p>
                    {it.detail && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{it.detail}</p>
                    )}
                    {it.walletAddress && (
                      <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5 break-all">{it.walletAddress}</p>
                    )}
                  </div>
                </div>
                {it.connected ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Conectado
                  </span>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    title="Próximamente"
                    className="h-9 px-4 border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    Conectar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
