import { useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './LanguageContext';
import { translations } from './translations';

const SUPPORTED = ['en', 'es'];

// Respect a saved choice, otherwise auto-detect from the browser.
// Runs only on the client (guards against SSR/prerender where these globals
// don't exist).
function detectLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    /* localStorage unavailable (private mode) — fall through to detection */
  }
  if (typeof navigator !== 'undefined') {
    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('es')) return 'es';
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  // Start in English so the first client render matches the prerendered
  // (server) HTML — no hydration mismatch. We switch to the detected language
  // right after mount.
  const [lang, setLang] = useState('en');

  // Detect language on the client, once, after hydration. Setting state here is
  // intentional: it keeps the first client render in English to match the
  // prerendered HTML, then switches — avoiding a hydration mismatch.
  useEffect(() => {
    const detected = detectLang();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (detected !== 'en') setLang(detected);
  }, []);

  // Reflect the active language in <html lang> and persist the choice.
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* ignore persistence errors */
    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
