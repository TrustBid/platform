'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders, getJwt } from '@/lib/auth/sep10';
import { API_BASE_URL as API } from '@/lib/api/base-url';

/**
 * Hooks de los recursos que alimentan Configuración: áreas, plantillas de
 * pipeline y preferencias de notificación.
 *
 * Todos siguen la misma forma: el efecto hace la primera carga inline y las
 * mutaciones devuelven `true`/`false` para que la pantalla decida qué mostrar.
 */

/** GET que nunca falla: ante cualquier error devuelve la lista vacía. */
async function getList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = (await res.json()) as T[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function send(method: string, path: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Áreas ────────────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  name: string;
  description: string | null;
  budgetAmount: number;
  spentAmount: number;
  responsableId: string | null;
  responsableName: string | null;
  members: number;
}

export interface AreaInput {
  name: string;
  description?: string;
  budgetAmount?: number;
  responsableId?: string | null;
}

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setAreas(await getList<Area>('/my/areas'));
  }, []);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    getList<Area>('/my/areas').then(setAreas).finally(() => setLoading(false));
  }, []);

  const create = useCallback(
    async (input: AreaInput) => {
      const ok = await send('POST', '/my/areas', input);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  const update = useCallback(
    async (id: string, input: AreaInput) => {
      const ok = await send('PATCH', `/my/areas/${id}`, input);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await send('DELETE', `/my/areas/${id}`);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  return { areas, loading, create, update, remove, refetch };
}

// ── Plantillas de pipeline ───────────────────────────────────────────────────

export interface TemplateStage {
  name: string;
  description: string | null;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  activeProjects: number;
  stages: TemplateStage[];
}

export interface TemplateInput {
  name: string;
  description?: string;
  stages: { name: string; description?: string }[];
}

export function usePipelineTemplates() {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setTemplates(await getList<PipelineTemplate>('/my/pipeline-templates'));
  }, []);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    getList<PipelineTemplate>('/my/pipeline-templates')
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const create = useCallback(
    async (input: TemplateInput) => {
      const ok = await send('POST', '/my/pipeline-templates', input);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  const update = useCallback(
    async (id: string, input: Partial<TemplateInput>) => {
      const ok = await send('PATCH', `/my/pipeline-templates/${id}`, input);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const ok = await send('POST', `/my/pipeline-templates/${id}/duplicate`);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await send('DELETE', `/my/pipeline-templates/${id}`);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  return { templates, loading, create, update, duplicate, remove, refetch };
}

// ── Preferencias de notificación ─────────────────────────────────────────────

export interface NotificationPreference {
  eventKey: string;
  channel: 'email' | 'whatsapp';
  enabled: boolean;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    getList<NotificationPreference>('/my/org/settings/notifications')
      .then(setPreferences)
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (prefs: NotificationPreference[]) => {
    const ok = await send('PUT', '/my/org/settings/notifications', {
      preferences: prefs,
    });
    if (ok) setPreferences(prefs);
    return ok;
  }, []);

  return { preferences, loading, save };
}

// ── Edición de usuarios ──────────────────────────────────────────────────────

export async function updateOrgUser(
  id: string,
  input: { role?: string; isActive?: boolean },
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API}/my/org/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    });
    if (res.ok) return { ok: true };
    // El backend rechaza degradar al último admin o a uno mismo: ese mensaje es
    // útil para el usuario, así que lo propagamos en vez de un error genérico.
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, message: body?.message };
  } catch {
    return { ok: false };
  }
}

// ── Invitaciones de usuario ──────────────────────────────────────────────────

export interface UserInvite {
  id: string;
  email: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export function useInvites(enabled: boolean) {
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    setInvites(await getList<UserInvite>('/my/org/invites'));
  }, []);

  useEffect(() => {
    // Sólo un admin puede listarlas; para el resto ni se intenta.
    if (!getJwt() || !enabled) { setLoading(false); return; }
    getList<UserInvite>('/my/org/invites').then(setInvites).finally(() => setLoading(false));
  }, [enabled]);

  const create = useCallback(
    async (email: string, role: string): Promise<{ ok: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API}/my/org/invites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ email, role }),
        });
        if (res.ok) {
          await refetch();
          return { ok: true };
        }
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return { ok: false, message: body?.message };
      } catch {
        return { ok: false };
      }
    },
    [refetch],
  );

  const revoke = useCallback(
    async (id: string) => {
      const ok = await send('DELETE', `/my/org/invites/${id}`);
      if (ok) await refetch();
      return ok;
    },
    [refetch],
  );

  return { invites, loading, create, revoke, refetch };
}

// ── Facturación ──────────────────────────────────────────────────────────────

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  maxProjects: number | null;
  maxUsers: number | null;
}

export interface BillingSummary {
  plan: BillingPlan;
  status: 'active' | 'cancelled';
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  usage: { label: string; used: number; limit: number | null }[];
  payments: {
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    paidAt: string;
    invoiceUrl: string | null;
  }[];
}

export function useBilling() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`${API}/my/billing`, { headers: authHeaders() });
      setSummary(res.ok ? ((await res.json()) as BillingSummary) : null);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    Promise.all([
      fetch(`${API}/my/billing`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      getList<BillingPlan>('/my/billing/plans'),
    ])
      .then(([s, p]) => { setSummary(s as BillingSummary | null); setPlans(p); })
      .finally(() => setLoading(false));
  }, []);

  const act = useCallback(
    async (path: string, body?: unknown): Promise<{ ok: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API}/my/billing/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (res.ok) {
          setSummary((await res.json()) as BillingSummary);
          return { ok: true };
        }
        const err = (await res.json().catch(() => null)) as { message?: string } | null;
        return { ok: false, message: err?.message };
      } catch {
        return { ok: false };
      }
    },
    [],
  );

  const changePlan = useCallback((planCode: string) => act('change-plan', { planCode }), [act]);
  const cancel = useCallback(() => act('cancel'), [act]);

  return { summary, plans, loading, changePlan, cancel, refetch };
}

// ── Subida de imágenes ───────────────────────────────────────────────────────

/** Sube el logo de la organización o la foto del usuario. Devuelve la URL. */
export async function uploadImage(
  target: 'logo' | 'avatar',
  file: File,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  const form = new FormData();
  form.append('file', file);
  try {
    // Sin Content-Type: el navegador arma el boundary del multipart.
    const res = await fetch(`${API}/my/org/${target}`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const body = (await res.json().catch(() => null)) as
      | { logoUrl?: string; avatarUrl?: string; message?: string }
      | null;
    if (!res.ok) return { ok: false, message: body?.message };
    return { ok: true, url: body?.logoUrl ?? body?.avatarUrl };
  } catch {
    return { ok: false };
  }
}
