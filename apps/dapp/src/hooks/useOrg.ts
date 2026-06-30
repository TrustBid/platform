'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders, getJwt } from '@/lib/auth/sep10';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  walletAddress: string | null;
  stellarNetwork: string;
  createdAt: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function useOrg() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    if (!getJwt()) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/my/org`, { headers: authHeaders() });
      if (!res.ok) throw new Error('failed');
      setOrg(await res.json());
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  return { org, loading, refetch: fetchOrg };
}

export function useOrgUsers() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    fetch(`${API}/my/org/users`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
