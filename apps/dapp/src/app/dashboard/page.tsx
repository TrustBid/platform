'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/ui/MetricCard';
import { RecentProjects } from '@/components/ui/RecentProjects';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { MetricData } from '@/types/dashboard';
import { useProjects } from '@/hooks/useProjects';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function DashboardPage() {
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const { user } = useCurrentUser();

  const totalBudget = projects.reduce((s, p) => s + p.budgetAmount, 0);
  const totalSpent  = projects.reduce((s, p) => s + p.spentAmount,  0);
  const active      = projects.filter((p) => p.status === 'active').length;
  const verified    = projects.filter((p) => p.blockchainEnabled).length;

  const metrics: MetricData[] = [
    { title: 'Total asignado',     value: totalBudget.toLocaleString(), unit: 'XLM', subtitle: `${projects.length} proyectos` },
    { title: 'Total ejecutado',    value: totalSpent.toLocaleString(),  unit: 'XLM', subtitle: `${projects.length} registros` },
    { title: 'Proyectos activos',  value: String(active),               subtitle: `${projects.length} en total` },
    { title: 'Verificados',        value: String(verified),             subtitle: 'Verificaciones on-chain' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 antialiased space-y-8">

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {user ? `Hola, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h2>
        <p className="text-xs text-slate-500">Resumen de la gestión de tus fondos</p>
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
            loading={projectsLoading}
            onViewAll={() => router.push('/dashboard/projects')}
            onCreateProject={() => router.push('/dashboard/projects?new=1')}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity events={[]} />
        </div>
      </section>

    </div>
  );
}
