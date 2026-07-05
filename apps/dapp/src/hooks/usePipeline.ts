'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/auth/sep10';
import { API_BASE_URL as API } from '@/lib/api/base-url';

export interface PipelineStage {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  status: 'completed' | 'current' | 'pending';
}

export function usePipeline(projectId: string | undefined) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStages = useCallback(async () => {
    if (!projectId) { setStages([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/my/projects/${projectId}/pipeline-stages`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch');
      setStages(await res.json());
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  return { stages, loading, refetch: fetchStages };
}
