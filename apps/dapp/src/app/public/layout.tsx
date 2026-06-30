import React from 'react';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { PublicNav } from '@/components/public/PublicNav';
import { Footer } from '@/components/public/Footer';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <LanguageProvider initialLocale={locale}>
      {/* Portal público — fondo blanco (tema claro forzado) */}
      <div className="force-light flex min-h-screen flex-col bg-white text-zinc-900 antialiased">
        <PublicNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
