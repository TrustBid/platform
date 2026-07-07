'use client';

import { useMemo } from 'react';
import { useProjects } from './useProjects';
import { useReports } from './useReports';

export interface DashboardMetrics {
  totalBudget: number;
  totalSpent: number;
  executionPercentage: number;
  pendingValidation: number;
  anchoredCount: number;
}

export function useDashboardMetrics(options?: { projectId?: string }) {
  const { projects, loading: projectsLoading } = useProjects();
  const { reports, loading: reportsLoading } = useReports();
  const projectId = options?.projectId;

  const loading = projectsLoading || reportsLoading;

  const metrics = useMemo<DashboardMetrics>(() => {
    const filteredProjects = projectId
      ? projects.filter((p) => p.id === projectId)
      : projects;

    const totalBudget = filteredProjects.reduce((acc, p) => acc + p.budgetAmount, 0);
    const totalSpent = filteredProjects.reduce((acc, p) => acc + p.spentAmount, 0);
    const executionPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const filteredProjectIds = new Set(filteredProjects.map((p) => p.id));
    const filteredReports = projectId
      ? reports.filter((r) => filteredProjectIds.has(r.projectId))
      : reports;

    const pendingValidation = filteredReports.filter(
      (r) => r.blockchainStatus === 'pending' || r.blockchainStatus === null,
    ).length;

    const anchoredCount = filteredReports.filter(
      (r) => r.anchorTxHash !== null && r.anchorTxHash !== undefined,
    ).length;

    return {
      totalBudget,
      totalSpent,
      executionPercentage,
      pendingValidation,
      anchoredCount,
    };
  }, [projects, reports, projectId]);

  return { metrics, loading };
}
