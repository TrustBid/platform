'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { RecentProjects } from '@/components/ui/RecentProjects';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { MetricData, ProjectItem, ActivityEvent } from '@/types/dashboard';

export default function DashboardPage() {
  // Estados mockeados listos para mutar cuando se integre Soroban 
  const [projects] = useState<ProjectItem[]>([]);
  const [activities] = useState<ActivityEvent[]>([]);

  const metrics: MetricData[] = [
    { title: 'Total Disbursed', value: '0', unit: 'XLM', subtitle: '0 transactions' },
    { title: 'Total Expenses', value: '0', unit: 'XLM', subtitle: '0 records' },
    { title: 'Active Projects', value: '0', subtitle: '0 total' },
    { title: 'Verified', value: '0', subtitle: '0 on-chain verifications' },
  ];

  const handleConnectFreighter = () => {
    console.info('Desplegando conexión con Freighter extension...');
  };

  const handleSignDemoTx = () => {
    console.info('Solicitando firma de transacción en Stellar Testnet...');
  };

  const handleCreateProject = () => {
    console.info('Disparando modal o redirección de creación...');
  };

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
            onClick={handleCreateProject}
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
          <RecentProjects projects={projects} onCreateProject={handleCreateProject} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity events={activities} />
        </div>
      </section>

    </div>
  );
}