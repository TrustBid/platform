// src/components/Hero.jsx
import { useEffect, useRef, useState } from 'react';
import LogoNav from '../assets/LogoNav.webp';
import gradient from '../assets/gradient.webp';
import logoGradient from '../assets/logoGradient.webp';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n/LanguageContext';

const DAPP_BASE = import.meta.env.VITE_DAPP_URL || 'https://dapp-production-52e7.up.railway.app';
const DAPP_LOGIN    = `${DAPP_BASE}/login`;
const DAPP_REGISTER = `${DAPP_BASE}/register`;
const DAPP_PUBLIC   = `${DAPP_BASE}/public`;

export default function Hero() {
  const { t } = useI18n();
  const starRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: t.nav.howItWorks, href: '#how-it-works' },
    { label: t.nav.about, href: '#about' },
    { label: t.nav.contact, href: '#footer' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!starRef.current) return;
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.5), 1);
      starRef.current.style.opacity = 0.55 + progress * 0.45;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#02040a] text-white overflow-hidden selection:bg-blue-500/30">
      {/* Navbar - Fixed full width */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md rounded-b-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <img src={LogoNav} alt="TrustBid Logo" style={{width: '135px', height: '26px'}} />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
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
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-gray-800 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition"
            >
              {t.nav.signIn}
            </a>
            <a
              href={DAPP_REGISTER}
              className="bg-[#0B28FE] hover:bg-blue-700 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white transition shadow-lg shadow-blue-500/25"
            >
              {t.nav.getStarted}
            </a>

            {/* Hamburger - mobile only */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-gray-900 hover:bg-gray-100 transition"
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

        {/* Mobile dropdown menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col px-4 pb-4 pt-1 border-t border-gray-100">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-gray-900 font-medium hover:text-[#0B28FE] transition border-b border-gray-50"
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <a
                href={DAPP_LOGIN}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-sm font-semibold text-gray-800 border border-gray-300 hover:bg-gray-50 transition"
              >
                {t.nav.signIn}
              </a>
              <a
                href={DAPP_REGISTER}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-sm font-semibold text-white transition"
                style={{ backgroundColor: '#0B28FE' }}
              >
                {t.nav.getStarted}
              </a>
              <a
                href={DAPP_PUBLIC}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 transition"
              >
                {t.nav.viewProjects}
              </a>
            </div>
            <LanguageSwitcher inline />
          </div>
        </div>
      </nav>

      {/* Hero Content - Add margin top for fixed navbar */}
      <div 
        className="relative w-full bg-cover bg-center pt-16 sm:pt-20"
        style={{backgroundImage: `url(${gradient})`, minHeight: '100vh'}}
      >
        {/* Logo Gradient - Responsive positioning */}
        <div
          ref={starRef}
          className="absolute hidden lg:block"
          style={{
            width: '718px',
            height: '622px',
            top: '109px',
            left: '900px',
            mixBlendMode: 'difference',
            objectFit: 'contain',
            opacity: 0.55,
          }}
        >
          <img src={logoGradient} alt="Logo Gradient" className="w-full h-full object-contain" />
        </div>

        {/* Text Content - Responsive */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-32 flex flex-col justify-center min-h-screen" style={{paddingBottom: '20vh'}}>
          <div className="max-w-2xl">
            {/* Transparency Infrastructure */}
            <span 
              className="block text-white font-medium select-none mb-[clamp(10px,3vw,20px)] text-[clamp(14px,4vw,20px)]"
              style={{
                fontFamily: 'Inter',
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              {t.hero.eyebrow}
            </span>

            {/* Every fund leaves a trace */}
            <h1
              className="text-liquid-crystal font-bold select-none leading-[0.9] text-[clamp(40px,11vw,100px)]"
              style={{
                fontFamily: 'Rubik',
                marginBottom: '0',
                letterSpacing: '-1px'
              }}
            >
              <span className="block">{t.hero.titleLine1}</span>
              <span className="block">{t.hero.titleLine2}</span>
            </h1>

            <a
              href={DAPP_PUBLIC}
              className="btn-glass inline-flex items-center px-6 sm:px-7 py-3 rounded-full text-sm sm:text-base font-semibold text-white mt-[clamp(24px,5vw,40px)]"
            >
              {t.hero.cta}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}