'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryBadge, ProjectStatusBadge } from './Badges';
import { formatNumber, formatUsd, pct } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { ProjectSummary } from '@/types/public';

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const { t } = useLanguage();
  const usedPct = pct(project.budgetSpentUsd, project.budgetTotalUsd);
  return (
    <Link href={`/public/projects/${project.id}`} className="group block">
      <Card className="h-full transition-all hover:border-blue-500/60 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={project.category} />
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight text-zinc-900 group-hover:text-blue-600 dark:text-white">
              {project.name}
            </h3>
            <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{project.summary}</p>
          </div>

          <div className="mt-auto space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">{t('card.budgetUsed')}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{usedPct}%</span>
              </div>
              <Progress value={usedPct} />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{formatUsd(project.budgetSpentUsd)} {t('card.spent')}</span>
                <span>{t('card.of')} {formatUsd(project.budgetTotalUsd)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Users className="h-3.5 w-3.5" />
                {formatNumber(project.beneficiariesReached)} {t('card.reached')}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {project.currentStage}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
