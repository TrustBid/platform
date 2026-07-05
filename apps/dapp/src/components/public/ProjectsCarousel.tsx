'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { ProjectSummary } from '@/types/public';

export function ProjectsCarousel({
  projects,
  categories,
}: {
  projects: ProjectSummary[];
  categories: string[];
}) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProjects =
    activeFilter === 'all' ? projects : projects.filter((p) => p.category === activeFilter);

  if (projects.length === 0) return null;

  return (
    <div className="w-full">
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
        {['all', ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveFilter(c)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === c
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
            )}
          >
            {c === 'all' ? t('explorer.all') : c}
          </button>
        ))}
        <Link
          href="/public/projects"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-950 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-950"
        >
          {t('home.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {filteredProjects.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">{t('explorer.empty')}</p>
      ) : (
        <Swiper
          key={activeFilter}
          modules={[EffectCoverflow, Navigation]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          loop={filteredProjects.length > 2}
          coverflowEffect={{ rotate: 0, stretch: -10, depth: 80, modifier: 1, slideShadows: false }}
          navigation
          className="projects-carousel w-full !py-4"
        >
          {filteredProjects.map((project) => (
            <SwiperSlide key={project.id} className="h-[160px] w-[70px] sm:h-[200px] sm:w-[90px]">
              {({ isActive }) => (
                <Link href={`/public/projects/${project.id}`} className="block h-full">
                  <div
                    className={cn(
                      'relative h-full w-full overflow-hidden rounded-3xl bg-zinc-100 transition-all duration-500 dark:bg-zinc-800',
                      isActive
                        ? 'opacity-100 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.35)]'
                        : 'opacity-50',
                    )}
                  >
                    {project.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-zinc-900 text-white/60">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-12 transition-opacity duration-300',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-white">{project.name}</p>
                      <p className="mt-0.5 text-xs text-white/70">{project.category}</p>
                    </div>
                  </div>
                </Link>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
