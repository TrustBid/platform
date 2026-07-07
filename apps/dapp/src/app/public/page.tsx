import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Wallet, Eye } from 'lucide-react';
import fondo from '@/assets/fondodonante.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectsCarousel } from '@/components/public/ProjectsCarousel';
import { FundUsageChart } from '@/components/public/FundUsageChart';
import { getNgo, listCategories, listProjects } from '@/server/public/repository';
import { getServerT } from '@/lib/i18n/server';
import { formatNumber, formatUsd } from '@/lib/format';

export default async function PublicLandingPage() {
  const [ngo, projects, categories, t] = await Promise.all([
    getNgo(),
    listProjects(),
    listCategories(),
    getServerT(),
  ]);

  return (
    <div>
      {/* HERO — con imagen de fondo. Se mete detrás del navbar (-mt-16) para que la
          imagen quede detrás de sus esquinas redondeadas y el redondeo se vea. */}
      <section className="relative -mt-16 overflow-hidden">
        <Image src={fondo} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-zinc-900/55" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-40">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="text-xl font-medium text-blue-200">{t('hero.subtitle')}</p>
            <p className="max-w-2xl text-base leading-relaxed text-white/85">{ngo.mission}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                className="h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Link href="/public/projects">
                  {t('hero.viewProjects')} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-white/60 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/public/projects">{t('hero.donate')}</Link>
              </Button>
            </div>
          </div>

          {/* Stats — planos sobre la imagen (sin cuadros) */}
          <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
            {[
              { label: t('projects.heading'), value: formatNumber(ngo.totals.projects) },
              { label: t('detail.totalBudget'), value: formatUsd(ngo.totals.raisedUsd) },
              { label: t('detail.beneficiariesReached'), value: formatNumber(ngo.totals.beneficiaries) },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white drop-shadow-sm">{s.value}</p>
                <p className="text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR PROJECTS — fondo blanco */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{t('home.projectsTitle')}</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-zinc-600">{t('home.projectsSubtitle')}</p>
        <div className="mt-8">
          <ProjectsCarousel projects={projects} categories={categories} />
        </div>
      </section>

      {/* HOW WE USE YOUR FUNDS — fondo blanco */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{t('funds.title')}</h2>
            <p className="text-sm leading-relaxed text-zinc-600">{t('funds.desc')}</p>
            <ul className="space-y-3">
              {[
                { icon: Eye, text: t('funds.point1') },
                { icon: ShieldCheck, text: t('funds.point2') },
                { icon: Wallet, text: t('funds.point3') },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-zinc-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="p-5">
              <p className="mb-2 text-sm font-semibold text-zinc-900">{t('funds.chartTitle')}</p>
              <FundUsageChart data={ngo.fundUsage} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Banda con la imagen de fondo — solo en la landing, antes del footer */}
      <section className="relative overflow-hidden">
        <Image src={fondo} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-zinc-900/55" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">{t('cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{t('cta.desc')}</p>
          <Button
            asChild
            className="mt-6 h-11 rounded-lg bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Link href="/public/projects">
              {t('cta.button')} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
