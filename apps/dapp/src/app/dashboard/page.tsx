'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { RecentProjects } from '@/components/ui/RecentProjects';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { MetricData, ProjectItem, ActivityEvent } from '@/types/dashboard';
import { useProjects } from '@/hooks/useProjects';
import { useRecentActivity } from '@/hooks/useRecentActivity';

export default function DashboardPage() {
  const router = useRouter();
  const { projects, loading: loadingProjects } = useProjects();
  const { activity } = useRecentActivity();

  const goToProjects = () => router.push('/dashboard/projects');

  const metrics: MetricData[] = useMemo(() => {
    const total = projects.length;
    const activeCount = projects.filter((p) => p.status === 'active').length;
    const blockchainCount = projects.filter((p) => p.blockchainEnabled).length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetAmount, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spentAmount, 0);
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Sumar montos solo tiene sentido con un único asset; si hay varios, se omite la unidad.
    const assets = new Set(projects.map((p) => p.budgetAsset));
    const unit = assets.size === 1 ? [...assets][0] : undefined;

    return [
      { title: 'Active Projects', value: activeCount, subtitle: `${total} total` },
      { title: 'Total Budget', value: totalBudget.toLocaleString(), unit, subtitle: `across ${total} project${total === 1 ? '' : 's'}` },
      { title: 'Executed', value: totalSpent.toLocaleString(), unit, subtitle: `${pct}% of budget` },
      { title: 'On-chain', value: blockchainCount, subtitle: `${blockchainCount} of ${total} projects` },
    ];
  }, [projects]);

  const recentProjects: ProjectItem[] = useMemo(
    () =>
      projects.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        budget: `${p.budgetAmount.toLocaleString()} ${p.budgetAsset}`,
      })),
    [projects],
  );

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

      {/* SECCIÓN DE TÍTULO */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-600 dark:text-slate-500">Overview of your fund management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 text-sm font-medium rounded-lg"
            onClick={goToProjects}
          >
            + New Project
          </Button>
          <ModeToggle />
        </div>
      </div>

      {/* SECCIÓN DE MÉTRICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} data={metric} />
        ))}
      </section>

      {/* SECCIÓN DE PANELES */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentProjects
            projects={recentProjects}
            loading={loadingProjects}
            onCreateProject={goToProjects}
            onSelectProject={(id) => router.push(`/dashboard/projects/${id}`)}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity events={activities} />
        </div>
      </section>

    </div>
  );
}
