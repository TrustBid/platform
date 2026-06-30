'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logodonante.jpg';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicNav() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40">
      <div className="relative flex h-16 items-center justify-between rounded-b-2xl bg-white px-4 shadow-sm sm:px-6">
        {/* Izquierda: logo (chico, en la punta izquierda) */}
        <Link href="/public" className="flex shrink-0 items-center">
          <Image src={logo} alt="TrustBid" height={28} className="h-7 w-auto object-contain" priority />
        </Link>

        {/* Centro: links centrados, texto negro */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          <Link
            href="/public"
            className="text-lg font-medium text-zinc-900 transition-colors hover:text-blue-600"
          >
            {t('nav.home')}
          </Link>
          <Link
            href="/public/projects"
            className="text-lg font-medium text-zinc-900 transition-colors hover:text-blue-600"
          >
            {t('nav.projects')}
          </Link>
        </nav>

        {/* Derecha: idioma (globo) + donar (píldora azul) en la punta derecha */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/public/projects"
            className="inline-flex h-9 items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t('nav.donate')}
          </Link>
        </div>
      </div>
    </header>
  );
}
