'use client';

import React from 'react';
import { FolderPlus } from 'lucide-react';
import { ProjectItem } from '@/types/dashboard';
import { Button } from './button';

interface RecentProjectsProps {
  projects: ProjectItem[];
  loading?: boolean;
  onCreateProject: () => void;
  onSelectProject?: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
};

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  loading = false,
  onCreateProject,
  onSelectProject,
}) => {
  const hasProjects = projects.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col min-h-[340px] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Recent Projects</h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">Your latest projects</p>
        </div>
        <button
          onClick={onCreateProject}
          className="text-xs text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 font-medium transition-colors"
        >
          View all ↗
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : !hasProjects ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="p-3.5 bg-muted rounded-xl text-muted-foreground select-none">
            <FolderPlus className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">No projects yet</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 max-w-[240px] leading-relaxed">
              Create your first project to get started managing funds.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onCreateProject}
          >
            Create Project
          </Button>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProject?.(p.id)}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">{p.budget}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_STYLES[p.status] ?? STATUS_STYLES.draft
                }`}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
