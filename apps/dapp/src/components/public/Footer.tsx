'use client';

import Image from 'next/image';
import logoFooter from '@/assets/logoFooter.jpg';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export function Footer() {
  const { t } = useLanguage();

  const navigationLinks = [
    { label: t('footer.problem'), href: '#' },
    { label: t('footer.howItWorks'), href: '#how-it-works' },
    { label: t('footer.joinList'), href: '#' },
  ];

  const resourceLinks = [
    { label: t('footer.contact'), href: '#footer' },
    { label: t('footer.docs'), href: '#' },
    { label: t('footer.faq'), href: '#' },
  ];

  const socialLinks = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/trustbidapp/' },
    { label: 'X', href: 'https://x.com/TrustBidApp' },
    { label: 'Instagram', href: 'https://www.instagram.com/trustbid_/' },
  ];

  return (
    <footer id="footer" className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Logo a la izquierda + links a la derecha, en la misma línea */}
        <div className="flex items-start justify-between border-b border-white/10 pb-8">
          <div>
            <Image
              src={logoFooter}
              alt="TrustBid Logo"
              className="mb-4 h-10 w-auto object-contain"
            />
            <p className="text-sm text-white">{t('footer.tagline')}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <h3 className="mb-4 font-semibold text-white">{t('footer.nav')}</h3>
              <ul className="space-y-2">
                {navigationLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-white">{t('footer.resources')}</h3>
              <ul className="space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-white">{t('footer.social')}</h3>
              <ul className="space-y-2">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} TrustBid. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
