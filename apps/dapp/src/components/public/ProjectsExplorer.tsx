'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ProjectCard } from './ProjectCard';
import { fetchProjects } from '@/lib/api/public';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { ProjectSummary } from '@/types/public';

export function ProjectsExplorer({
  initialProjects,
  categories,
}: {
  initialProjects: ProjectSummary[];
  categories: string[];
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);
  const { t } = useLanguage();

  // Re-consulta el endpoint cuando cambian los filtros (con debounce para el texto).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setProjects(await fetchProjects({ q, category }));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, category]);

  const filters = ['all', ...categories];

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('explorer.search')}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                category === c
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-border bg-background text-zinc-600 hover:border-blue-500/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
              )}
            >
              {c === 'all' ? t('explorer.all') : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="h-8 w-8 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t('explorer.empty')}</p>
        </div>
      ) : (
        <div className={cn('grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3', loading && 'opacity-60')}>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
