'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders, getJwt } from '@/lib/auth/sep10';
import { API_URL } from '@/lib/config';

const API = API_URL;

export interface Report {
  id: string;
  projectId: string;
  projectName: string;
  reportType: string;
  status: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  fundsUsedAmount: number;
  fundsUsedAsset: string;
  milestoneProgress: number | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface CreateReportInput {
  projectId: string;
  reportType: string;
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  fundsUsedAmount?: number;
  fundsUsedAsset?: string;
  milestoneProgress?: number;
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!getJwt()) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/my/reports`, { headers: authHeaders() });
      if (!res.ok) throw new Error('failed');
      setReports(await res.json());
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const createReport = async (input: CreateReportInput): Promise<{ id: string } | null> => {
    try {
      const res = await fetch(`${API}/my/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('failed');
      const created = await res.json();
      await fetchReports();
      return created;
    } catch {
      return null;
    }
  };

  return { reports, loading, createReport, refetch: fetchReports };
}
