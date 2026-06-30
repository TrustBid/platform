import { createContext, useContext } from 'react';

// Holds { lang, setLang, t } where `t` is the dictionary for the active language.
export const LanguageContext = createContext(null);

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider');
  return ctx;
}
