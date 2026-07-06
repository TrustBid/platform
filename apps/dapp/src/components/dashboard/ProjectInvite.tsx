'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Check, Copy, Plus, QrCode, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { authHeaders } from '@/lib/auth/sep10';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface Invite {
  id: string;
  code: string;
  label: string | null;
  maxUses: number;
  uses: number;
  waLink: string | null;
  tgLink: string | null;
}

export function ProjectInvite({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [qr, setQr] = useState<Record<string, string>>({}); // key: `${id}:wa|tg` → dataURL
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/my/bot/invites?projectId=${projectId}`, { headers: authHeaders() });
    if (res.status === 401) { router.push('/login'); return; }
    if (res.ok) setInvites(await res.json());
  }, [projectId, router]);

  useEffect(() => { if (open) load(); }, [open, load]);

  // Genera los QR (data URL) para los links de cada invitación.
  useEffect(() => {
    (async () => {
      const next: Record<string, string> = {};
      for (const inv of invites) {
        if (inv.waLink) next[`${inv.id}:wa`] = await QRCode.toDataURL(inv.waLink, { margin: 1, width: 220 });
        if (inv.tgLink) next[`${inv.id}:tg`] = await QRCode.toDataURL(inv.tgLink, { margin: 1, width: 220 });
      }
      setQr(next);
    })();
  }, [invites]);

  async function create() {
    setCreating(true);
    try {
      const res = await fetch(`${API}/my/bot/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ projectId, label: projectName }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) await load();
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
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
        onClick={() => setOpen(true)}
      >
        <QrCode className="h-3.5 w-3.5" />
        Invitar voluntarios
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-2xl bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white max-h-[92vh] overflow-y-auto p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Invitar voluntarios a "{projectName}"</h2>
              <p className="text-xs text-zinc-500">Quien escanee queda habilitado para rendir gastos de este proyecto — sin escribir códigos.</p>
            </div>
            <Button size="sm" onClick={create} disabled={creating} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> {creating ? '…' : 'Generar'}
            </Button>
          </div>

          {invites.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Generá una invitación para obtener el QR.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {invites.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">Usos: {inv.uses}/{inv.maxUses} · <span className="font-mono">{inv.code}</span></p>
                    <Button variant="ghost" size="sm" onClick={() => revoke(inv.id)} className="h-7 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* WhatsApp */}
                    {inv.waLink && (
                      <QrCard
                        title="WhatsApp"
                        color="text-emerald-600"
                        img={qr[`${inv.id}:wa`]}
                        link={inv.waLink}
                        copied={copied === `${inv.id}:wa`}
                        onCopy={() => copy(inv.waLink!, `${inv.id}:wa`)}
                      />
                    )}
                    {/* Telegram */}
                    {inv.tgLink ? (
                      <QrCard
                        title="Telegram"
                        color="text-sky-600"
                        img={qr[`${inv.id}:tg`]}
                        link={inv.tgLink}
                        copied={copied === `${inv.id}:tg`}
                        onCopy={() => copy(inv.tgLink!, `${inv.id}:tg`)}
                      />
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-center text-[11px] text-zinc-400">
                        Telegram: configurá TELEGRAM_BOT_USERNAME para el QR
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-[11px] text-zinc-500">
            El voluntario escanea → se abre el chat con el bot y un mensaje pre-cargado → envía → queda habilitado en este proyecto. Después manda la foto de la factura y listo.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QrCard({
  title,
  color,
  img,
  link,
  copied,
  onCopy,
}: {
  title: string;
  color: string;
  img?: string;
  link: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        {title === 'Telegram' ? <Send className={`h-4 w-4 ${color}`} /> : <QrCode className={`h-4 w-4 ${color}`} />}
        <span className={color}>{title}</span>
      </div>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={`QR ${title}`} className="h-40 w-40 rounded bg-white" />
      ) : (
        <div className="h-40 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      )}
      <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
        {copied ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar link</>}
      </Button>
    </div>
  );
}
