import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import type { PipelineStage } from '@/types/public';

export function PipelineSteps({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const done = stage.status === 'done';
        const current = stage.status === 'current';
        return (
          <div key={stage.key} className="flex min-w-[120px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className="h-0.5 flex-1 bg-transparent" />
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  done && 'border-blue-600 bg-blue-600 text-white',
                  current && 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40',
                  !done && !current && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div
                className={cn(
                  'h-0.5 flex-1',
                  isLast ? 'bg-transparent' : done ? 'bg-blue-600' : 'bg-border',
                )}
              />
            </div>
            <div className="mt-2 text-center">
              <p
                className={cn(
                  'text-xs font-semibold',
                  current ? 'text-blue-600' : done ? 'text-zinc-900 dark:text-white' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {stage.date ? formatDate(stage.date) : '—'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
