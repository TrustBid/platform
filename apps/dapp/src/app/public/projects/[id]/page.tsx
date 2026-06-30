import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBadge, ProjectStatusBadge } from '@/components/public/Badges';
import { PipelineSteps } from '@/components/public/PipelineSteps';
import { TraceabilityTable } from '@/components/public/TraceabilityTable';
import { ImpactIndicators } from '@/components/public/ImpactIndicators';
import { getProject } from '@/server/public/repository';
import { getServerT } from '@/lib/i18n/server';
import { formatNumber, formatUsd, pct } from '@/lib/format';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, t] = await Promise.all([getProject(id), getServerT()]);
  if (!project) notFound();

  const usedPct = pct(project.budgetSpentUsd, project.budgetTotalUsd);
  const reachedPct = pct(project.beneficiariesReached, project.beneficiariesTarget);

  const stats = [
    { label: t('detail.totalBudget'), value: formatUsd(project.budgetTotalUsd), icon: DollarSign, sub: project.currency },
    { label: t('detail.spent'), value: formatUsd(project.budgetSpentUsd), icon: TrendingUp, sub: `${usedPct}% ${t('detail.executed')}` },
    {
      label: t('detail.beneficiariesReached'),
      value: formatNumber(project.beneficiariesReached),
      icon: Users,
      sub: `${reachedPct}% ${t('detail.of')} ${formatNumber(project.beneficiariesTarget)}`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/public/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={project.category} />
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{project.name}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {project.description}
          </p>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Link href={`/public/donate/${project.id}`}>
            {t('detail.donateBtn')} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{s.label}</span>
                <s.icon className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t('detail.pipelineTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineSteps stages={project.pipeline} />
        </CardContent>
      </Card>

      {/* Fund traceability */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t('detail.traceTitle')}</CardTitle>
          <p className="text-xs text-zinc-500">{t('detail.traceSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <TraceabilityTable entries={project.traceability} />
        </CardContent>
      </Card>

      {/* Impact */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t('detail.impactTitle')}</CardTitle>
          <p className="text-xs text-zinc-500">{t('detail.impactSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <ImpactIndicators indicators={project.impact} />
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      <div className="mt-10 flex justify-center">
        <Button
          asChild
          className="h-11 rounded-lg bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Link href={`/public/donate/${project.id}`}>{t('detail.donateBtn')}</Link>
        </Button>
      </div>
    </div>
  );
}
