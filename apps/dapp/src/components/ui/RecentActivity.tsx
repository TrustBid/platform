'use client';

import React from 'react';
import { ShieldCheck, ArrowUpRight, Receipt, ExternalLink } from 'lucide-react';
import { explorerTxUrl } from '@/lib/stellar-explorer';
import { ActivityEvent } from '@/types/dashboard';

interface RecentActivityProps {
  events: ActivityEvent[];
}

const TYPE_ICON: Record<ActivityEvent['type'], React.ComponentType<{ className?: string }>> = {
  verification: ShieldCheck,
  disbursement: ArrowUpRight,
  expense: Receipt,
};

function formatWhen(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ events }) => {
  const hasActivity = events.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col min-h-[340px] shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Recent Activity</h3>
        <p className="text-xs text-slate-600 dark:text-slate-500">Latest events across projects</p>
      </div>

      {!hasActivity ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="p-3.5 bg-muted rounded-xl text-muted-foreground select-none">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">No activity yet</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 max-w-[240px] leading-relaxed">
              Activity will appear here once you start adding data or signing txs.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {events.map((e) => {
            const Icon = TYPE_ICON[e.type] ?? ArrowUpRight;
            return (
              <div key={e.id} className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-muted rounded-lg text-muted-foreground shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-snug break-words">{e.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-600 dark:text-slate-500">{formatWhen(e.timestamp)}</span>
                    {e.txHash && (
                      <a
                        href={explorerTxUrl(e.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {e.txHash.slice(0, 8)}…
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
