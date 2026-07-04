'use client';

import { useEffect, useState } from 'react';
import { authHeaders, clearJwt, getJwt } from '@/lib/auth/sep10';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  organizationId: string;
  walletAddress: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }

    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
