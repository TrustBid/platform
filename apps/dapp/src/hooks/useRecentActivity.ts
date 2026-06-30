'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/auth/sep10';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export interface RecentActivityItem {
  id: string;
  projectId: string | null;
  projectName: string | null;
  concept: string;
  amount: number;
  assetCode: string;
  status: string;
  txHash: string | null;
  occurredAt: string;
}

export function useRecentActivity() {
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/my/projects/recent-activity`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      setActivity(await res.json());
    } catch {
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return { activity, loading, refetch: fetchActivity };
}
