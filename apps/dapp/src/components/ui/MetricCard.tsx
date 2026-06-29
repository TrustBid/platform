'use client';

import React from 'react';
import { MetricData } from '@/types/dashboard';

interface MetricCardProps {
  data: MetricData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const { title, value, unit, subtitle, icon } = data;
  
  return (
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wider uppercase">{title}</span>
        {icon && <span className="text-slate-600 dark:text-slate-500 text-base">{icon}</span>}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {value} {unit && <span className="text-2xl font-bold text-zinc-900 dark:text-white ml-1">{unit}</span>}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
  );
};