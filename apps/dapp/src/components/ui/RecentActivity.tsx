'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ActivityEvent } from '@/types/dashboard';

interface RecentActivityProps {
  events: ActivityEvent[];
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
          {/* Listado de eventos on-chain */}
        </div>
      )}
    </div>
  );
};