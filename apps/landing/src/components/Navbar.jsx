import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoNav from '../assets/LogoNav.webp';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n/LanguageContext';

const DAPP_BASE = import.meta.env.VITE_DAPP_URL || 'https://dapp-production-52e7.up.railway.app';
const DAPP_LOGIN = `${DAPP_BASE}/login`;
const DAPP_REGISTER = `${DAPP_BASE}/register`;
const DAPP_PUBLIC = `${DAPP_BASE}/public`;

function navHref(pathname, hash) {
  return pathname === '/' ? hash : `/${hash}`;
}

export default function Navbar() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: t.nav.about, href: navHref(pathname, '#about') },
    { label: t.nav.howItWorks, href: navHref(pathname, '#how-it-works') },
    { label: t.nav.contact, href: navHref(pathname, '#footer') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full rounded-b-2xl bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link to="/" className="shrink-0">
          <img src={LogoNav} alt="TrustBid Logo" style={{ width: '135px', height: '26px' }} />
        </Link>

        <div className="hidden items-center gap-8 md:flex lg:gap-10">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <a
            href={DAPP_LOGIN}
            className="hidden items-center rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 sm:inline-flex sm:text-sm"
          >
            {t.nav.signIn}
          </a>
          <a
            href={DAPP_REGISTER}
            className="rounded-full bg-[#0B28FE] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 sm:px-5 sm:text-sm"
          >
            {t.nav.getStarted}
          </a>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition hover:bg-gray-100 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col border-t border-gray-100 px-4 pb-4 pt-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-gray-50 py-3 font-medium text-gray-900 transition hover:text-[#0B28FE]"
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            <a
              href={DAPP_LOGIN}
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-full border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              {t.nav.signIn}
            </a>
            <a
              href={DAPP_REGISTER}
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-full py-2.5 text-center text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#0B28FE' }}
            >
              {t.nav.getStarted}
            </a>
            <a
              href={DAPP_PUBLIC}
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-full py-2.5 text-center text-sm font-medium text-gray-500 transition hover:text-gray-700"
            >
              {t.nav.viewProjects}
            </a>
          </div>
          <LanguageSwitcher inline />
        </div>
      </div>
    </nav>
  );
}
