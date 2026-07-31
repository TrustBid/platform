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
