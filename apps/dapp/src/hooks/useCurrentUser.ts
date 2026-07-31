'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders, getJwt } from '@/lib/auth/sep10';

import { API_BASE_URL as API } from '@/lib/api/base-url';

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  organizationId: string;
  walletAddress: string | null;
}

/** Lee el usuario actual. Sin estado propio, para poder reusarla. */
async function loadMe(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Para que una pantalla que acaba de guardar relea la fuente de verdad en
  // vez de asumir lo que mandó. No se invoca desde el efecto de abajo a
  // propósito: llamar un callback con setState desde un efecto es justo lo que
  // marca react-hooks/set-state-in-effect.
  const refetch = useCallback(async () => {
    setUser(await loadMe());
  }, []);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    loadMe().then(setUser).finally(() => setLoading(false));
  }, []);

  return { user, loading, refetch };
}
