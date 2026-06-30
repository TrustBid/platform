'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus, ArrowUpRight } from 'lucide-react';

interface ProjectRow {
  id: string;
  name: string;
  status: string;
  budgetAmount: number;
  spentAmount: number;
  budgetAsset: string;
}

interface RecentProjectsProps {
  projects: ProjectRow[];
  loading?: boolean;
  onViewAll?: () => void;
  onCreateProject?: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-500',
  active:    'bg-green-100 text-green-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', paused: 'Pausado', completed: 'Completado',
};

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  loading,
  onViewAll,
  onCreateProject,
}) => {
  const router = useRouter();
  const recent = projects.slice(0, 4);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col min-h-[340px] shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Proyectos recientes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Últimos proyectos activos</p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors"
          >
            Ver todos <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : recent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="p-3.5 bg-muted rounded-xl text-muted-foreground select-none">
            <FolderPlus className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Sin proyectos aún</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
              Crea tu primer proyecto para comenzar a gestionar fondos.
            </p>
          </div>
          <button
            onClick={onCreateProject}
            className="text-xs font-semibold text-[#0F52BA] hover:underline"
          >
            Crear proyecto →
          </button>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {recent.map((p) => {
            const pct = p.budgetAmount > 0 ? Math.round((p.spentAmount / p.budgetAmount) * 100) : 0;
            const statusCls = STATUS_COLOR[p.status] ?? STATUS_COLOR.draft;
            const statusLbl = STATUS_LABEL[p.status] ?? p.status;
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400 flex-shrink-0">{pct}%</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusCls}`}>
                  {statusLbl}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
