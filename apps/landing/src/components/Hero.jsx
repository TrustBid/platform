// src/components/Hero.jsx
import { useEffect, useRef } from 'react';
import gradient from '../assets/gradient.webp';
import logoGradient from '../assets/logoGradient.webp';
import Navbar from './Navbar';
import { useI18n } from '../i18n/LanguageContext';

const DAPP_BASE = import.meta.env.VITE_DAPP_URL || 'https://dapp-production-52e7.up.railway.app';
const DAPP_PUBLIC = `${DAPP_BASE}/public`;

export default function Hero() {
  const { t } = useI18n();
  const starRef = useRef(null);

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
      <Navbar />

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