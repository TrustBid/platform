'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/auth/sep10';
import { API_URL } from '@/lib/config';

const API = API_URL;

export interface Project {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
  beneficiary: string;
  budgetAmount: number;
  spentAmount: number;
  budgetAsset: string;
  blockchainEnabled: boolean;
  currentStage: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  beneficiary?: string;
  category: string;
  budgetAmount: number;
  budgetAsset?: string;
  startDate?: string;
  endDate?: string;
  blockchainEnabled?: boolean;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/my/projects`, { headers: authHeaders() });
      if (res.status === 401) { setError('unauthenticated'); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      setProjects(await res.json());
    } catch {
      setError('Error cargando proyectos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (input: CreateProjectInput): Promise<{ id: string } | null> => {
    try {
      const res = await fetch(`${API}/my/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create');
      const created = await res.json();
      await fetchProjects();
      return created;
    } catch {
      return null;
    }
  };

  return { projects, loading, error, createProject, refetch: fetchProjects };
}
