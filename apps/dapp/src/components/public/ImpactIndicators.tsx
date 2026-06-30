'use client';

import { Progress } from '@/components/ui/progress';
import { formatNumber, pct } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { ImpactIndicator } from '@/types/public';

export function ImpactIndicators({ indicators }: { indicators: ImpactIndicator[] }) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {indicators.map((ind) => {
        const p = pct(ind.actual, ind.target);
        return (
          <div key={ind.label} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{ind.label}</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {formatNumber(ind.actual)}{' '}
                <span className="text-xs font-normal text-zinc-500">/ {formatNumber(ind.target)} {ind.unit}</span>
              </span>
            </div>
            <Progress value={p} indicatorClassName={p >= 100 ? 'bg-emerald-600' : undefined} />
            <p className="text-right text-xs text-zinc-500">{p}% {t('impact.ofTarget')}</p>
          </div>
        );
      })}
    </div>
  );
}
