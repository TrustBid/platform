import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
];

export default function LanguageSwitcher({ align = 'right', inline = false }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open || inline) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, inline]);

  return (
    <div ref={ref} className={inline ? 'w-full' : 'relative'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          inline
            ? 'flex items-center gap-1.5 w-full py-3 text-sm font-medium text-gray-700'
            : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition'
        }
      >
        {/* Globe */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
        </svg>
        <span>{current.short}</span>
        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className={
            inline
              ? 'w-full rounded-xl bg-gray-50 overflow-hidden py-1'
              : `absolute z-50 mt-2 min-w-[150px] rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden py-1 ${align === 'right' ? 'right-0' : 'left-0'}`
          }
        >
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition ${
                    active ? 'text-[#0B28FE] font-semibold bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{l.label}</span>
                  {active && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
