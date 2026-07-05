'use client';

import { useMemo, useState, useEffect } from 'react';
import { useProjects } from './useProjects';
import { useRecentActivity } from './useRecentActivity';
import { useReports } from './useReports';

export type AlertSeverity = 'warning' | 'error' | 'info' | 'success';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
}

const ONE_DAY_MS = 86_400_000;

export function useAlerts() {
  const { projects } = useProjects();
  const { activity } = useRecentActivity();
  const { reports } = useReports();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const alerts = useMemo<DashboardAlert[]>(() => {
    const result: DashboardAlert[] = [];

    // Pending reports (blockchainStatus still pending/null)
    const pendingReports = reports.filter(
      (r) => r.blockchainStatus === 'pending' || r.blockchainStatus === null,
    );
    if (pendingReports.length > 0) {
      result.push({
        id: 'pending-reports',
        severity: 'warning',
        title: 'Reportes sin validar',
        description: `${pendingReports.length} reporte${pendingReports.length > 1 ? 's' : ''} esperan revisión`,
        timestamp: new Date(now - 2 * 3600_000).toISOString(),
      });
    }

    // Failed blockchain anchoring
    const failedProjects = projects.filter((p) => p.blockchainStatus === 'failed');
    failedProjects.forEach((p) => {
      result.push({
        id: `failed-${p.id}`,
        severity: 'error',
        title: 'Anclaje fallido',
        description: `Proyecto "${p.name}" falló al anclar on-chain`,
        timestamp: new Date(now - ONE_DAY_MS).toISOString(),
      });
    });

    // Delayed disbursements (pending transactions older than 24h)
    const delayedActivity = activity.filter(
      (a) => a.status === 'pending' && now - new Date(a.occurredAt).getTime() > ONE_DAY_MS,
    );
    if (delayedActivity.length > 0) {
      result.push({
        id: 'delayed-disbursement',
        severity: 'error',
        title: 'Desembolso demorado',
        description: `${delayedActivity.length} pago${delayedActivity.length > 1 ? 's' : ''} pendiente${delayedActivity.length > 1 ? 's' : ''} por más de 24h`,
        timestamp: new Date(now - 26 * 3600_000).toISOString(),
      });
    }

    // Successful anchoring (success alerts)
    const anchoredReports = reports.filter(
      (r) => r.anchorTxHash !== null && r.anchorTxHash !== undefined,
    );
    if (anchoredReports.length > 0) {
      result.push({
        id: 'anchored-reports',
        severity: 'success',
        title: 'Reportes anclados',
        description: `${anchoredReports.length} reporte${anchoredReports.length > 1 ? 's' : ''} verificado${anchoredReports.length > 1 ? 's' : ''} on-chain`,
        timestamp: new Date(now - ONE_DAY_MS).toISOString(),
      });
    }

    return result;
  }, [projects, activity, reports, now]);

  const alertCount = alerts.filter((a) => a.severity === 'error' || a.severity === 'warning').length;

  return { alerts, alertCount };
}
