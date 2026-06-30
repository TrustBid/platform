'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { RecentProjects } from '@/components/ui/RecentProjects';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { MetricData, ActivityEvent } from '@/types/dashboard';
import { useProjects } from '@/hooks/useProjects';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function DashboardPage() {
  const router = useRouter();
  const { projects, loading: loadingProjects } = useProjects();
  const { activity } = useRecentActivity();
  const { user } = useCurrentUser();

  const metrics: MetricData[] = useMemo(() => {
    const total = projects.length;
    const activeCount = projects.filter((p) => p.status === 'active').length;
    const blockchainCount = projects.filter((p) => p.blockchainEnabled).length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetAmount, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spentAmount, 0);
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const assets = new Set(projects.map((p) => p.budgetAsset));
    const unit = assets.size === 1 ? [...assets][0] : undefined;

    return [
      { title: 'Proyectos activos', value: activeCount, subtitle: `${total} en total` },
      { title: 'Presupuesto total', value: totalBudget.toLocaleString(), unit, subtitle: `entre ${total} proyecto${total === 1 ? '' : 's'}` },
      { title: 'Total ejecutado', value: totalSpent.toLocaleString(), unit, subtitle: `${pct}% del presupuesto` },
      { title: 'Verificados on-chain', value: blockchainCount, subtitle: `${blockchainCount} de ${total} proyectos` },
    ];
  }, [projects]);

  const activities: ActivityEvent[] = useMemo(
    () =>
      activity.map((a) => ({
        id: a.id,
        type: 'disbursement' as const,
        description: a.projectName ? `${a.concept} · ${a.projectName}` : a.concept,
        timestamp: a.occurredAt,
        txHash: a.txHash ?? undefined,
      })),
    [activity],
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 antialiased space-y-8">

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {user ? `Hola, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Resumen de la gestión de tus fondos</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <MetricCard key={i} data={metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentProjects
            projects={projects}
            loading={loadingProjects}
            onViewAll={() => router.push('/dashboard/projects')}
            onCreateProject={() => router.push('/dashboard/projects?new=1')}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity events={activities} />
        </div>
      </section>

    </div>
  );
}
