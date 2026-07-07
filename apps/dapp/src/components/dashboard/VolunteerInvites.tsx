'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Link2, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authHeaders } from '@/lib/auth/sep10';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface Invite {
  id: string;
  code: string;
  label: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  waLink: string | null;
}

export function VolunteerInvites() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`${API}/my/bot/invites`, { headers: authHeaders() });
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setInvites(await res.json());
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function create() {
    setCreating(true);
    try {
      const res = await fetch(`${API}/my/bot/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) { setLabel(''); await load(); }
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`${API}/my/bot/invites/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) await load();
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch { /* noop */ }
  }

  return (
    <Card className="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6 border-b border-zinc-200 dark:border-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Voluntarios por WhatsApp</CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Generá un link de invitación y compartilo. Cada voluntario que lo abra y envíe queda habilitado solo.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {/* Crear invitación */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Etiqueta (opcional)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Brigada norte"
              className="mt-1"
            />
          </div>
          <Button onClick={create} disabled={creating} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> {creating ? 'Generando…' : 'Generar link'}
          </Button>
        </div>

        {/* Lista de invitaciones activas */}
        {invites.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">Todavía no generaste invitaciones.</p>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {inv.label || 'Invitación'} <span className="font-mono text-xs text-zinc-500">· {inv.code}</span>
                    </p>
                    <p className="text-xs text-zinc-500">Usos: {inv.uses}/{inv.maxUses}{inv.expiresAt && ` · vence ${new Date(inv.expiresAt).toLocaleDateString('es-CO')}`}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revoke(inv.id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {inv.waLink ? (
                    <>
                      <div className="flex-1 truncate rounded-md bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                        {inv.waLink}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copy(inv.waLink!, inv.id)} className="gap-1.5">
                        {copied === inv.id ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                      </Button>
                    </>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600">
                      <Link2 className="h-3.5 w-3.5" />
                      Configurá el número del bot (WHATSAPP_BOT_NUMBER) para generar el link. Código: <span className="font-mono">{inv.code}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-zinc-500">
          El voluntario abre el link → se abre WhatsApp con el bot y un mensaje pre-cargado → toca Enviar → queda habilitado (su número se agrega solo). Después manda la foto de la factura y el código del proyecto.
        </p>
      </CardContent>
    </Card>
  );
}
