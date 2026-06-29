'use client';

import React from 'react';
import { FolderPlus } from 'lucide-react';
import { ProjectItem } from '@/types/dashboard';
import { Button } from './button';

interface RecentProjectsProps {
  projects: ProjectItem[];
  onCreateProject: () => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({ projects, onCreateProject }) => {
  const hasProjects = projects.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col min-h-[340px] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Recent Projects</h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">Your latest projects</p>
        </div>
        <button className="text-xs text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 font-medium transition-colors">
          View all ↗
        </button>
      </div>

      {!hasProjects ? (
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
        <div className="space-y-3 flex-1 overflow-y-auto">
          {/* Mapeo de proyectos en producción iría aquí */}
        </div>
      )}
    </div>
  );
};