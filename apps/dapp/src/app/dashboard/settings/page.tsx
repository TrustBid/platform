'use client';

import React, { useState } from 'react';
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
import { useCurrentUser } from '@/hooks/useCurrentUser';

// --- Datos locales (mismo formato que devolverá el backend) ---
const USERS = [
  { id: 'u1', name: 'María García', email: 'maria@latir.org', role: 'Admin', scope: null, status: 'Active', lastLogin: '2024-03-15' },
  { id: 'u2', name: 'Carlos López', email: 'carlos@latir.org', role: 'Responsable', scope: 'Obras', status: 'Active', lastLogin: '2024-03-14' },
  { id: 'u3', name: 'Ana Rodríguez', email: 'ana@latir.org', role: 'Contador', scope: null, status: 'Active', lastLogin: '2024-03-15' },
  { id: 'u4', name: 'Roberto Silva', email: 'roberto@techo.org', role: 'Admin', scope: null, status: 'Active', lastLogin: '2024-03-12' },
];

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

const INTEGRATIONS = [
  { id: 'i1', name: 'Stellar Testnet', description: 'Red de pruebas para anclaje on-chain.', connected: true },
  { id: 'i2', name: 'USDC', description: 'Stablecoin para fondeo y desembolsos.', connected: true },
  { id: 'i3', name: 'Email / SMTP', description: 'Notificaciones por correo a donantes.', connected: false },
  { id: 'i4', name: 'WhatsApp API', description: 'Avisos y reportes por WhatsApp.', connected: false },
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

      {tab === 'general' && <GeneralTab user={user} />}
      {tab === 'users' && <UsersTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'integrations' && <IntegrationsTab />}
    </div>
  );
}

/* ---------- GENERAL ---------- */
function GeneralTab({ user }: { user: import('@/hooks/useCurrentUser').CurrentUser | null }) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const displayEmail = user?.walletAddress ?? user?.email ?? '';
  const isWalletUser = !!user?.walletAddress;

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
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{user?.name ?? '—'}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-500 capitalize">{user?.role ?? 'admin'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre completo</label>
              <Input
                defaultValue={user?.name ?? ''}
                className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700 focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {isWalletUser ? 'Wallet Stellar' : 'Correo electrónico'}
              </label>
              <Input
                defaultValue={displayEmail}
                disabled
                className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Teléfono</label>
              <Input placeholder="+__ ___ ___ ____" className="bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-700" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Rol</label>
              <Input defaultValue={user?.role ?? ''} disabled className="bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800/80 dark:text-zinc-500 cursor-not-allowed capitalize" />
            </div>
          </div>
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

      <div className="flex justify-end pt-2">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg transition-colors">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

/* ---------- USUARIOS Y ROLES ---------- */
function UsersTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Usuarios y roles</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <Mail className="h-4 w-4" />
          Invitar usuario
        </Button>
      </div>

      <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {['Nombre', 'Email', 'Rol', 'Alcance', 'Estado', 'Último ingreso'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className="border-b border-zinc-200/70 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</td>
                  <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400">{u.email}</td>
                  <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">{u.role}</td>
                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{u.scope ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors">
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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4 rounded-lg flex items-center gap-2 transition-colors">
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
function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Integraciones</h2>

      <div className="space-y-3">
        {INTEGRATIONS.map((it) => (
          <Card key={it.id} className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 text-blue-600 dark:bg-zinc-900 dark:text-blue-500 rounded-lg">
                  <Plug className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{it.name}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{it.description}</p>
                </div>
              </div>
              {it.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </span>
              ) : (
                <Button variant="outline" className="h-9 px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  Conectar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
