import { ProjectsExplorer } from '@/components/public/ProjectsExplorer';
import { listCategories, listProjects } from '@/server/public/repository';
import { getServerT } from '@/lib/i18n/server';

export default async function PublicProjectsPage() {
  const [projects, categories, t] = await Promise.all([
    listProjects(),
    listCategories(),
    getServerT(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {t('projects.heading')}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t('projects.subheading')}</p>
      </div>
      <ProjectsExplorer initialProjects={projects} categories={categories} />
    </div>
  );
}
