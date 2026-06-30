// src/components/AccessModal.jsx
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { ACCESS_EVENT } from '../lib/accessModal';
import logo from '../assets/logoFooter.webp';

// Formspree endpoint. The id isn't secret (it travels in the browser request
// anyway), so we hardcode it as the default and let VITE_FORMSPREE_ID override
// it without a code change. This keeps the form working regardless of the
// build-time env config.
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || 'mdarorkz';
const ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;
const STORAGE_KEY = 'tb_access';

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/12 text-sm text-white ' +
  'placeholder:text-white/25 transition outline-none focus:border-[#0B28FE] ' +
  'focus:bg-white/[0.06] focus:ring-2 focus:ring-[#0B28FE]/25';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[12px] font-medium text-white/45">{label}</span>
      {children}
    </label>
  );
}

export default function AccessModal() {
  const { t } = useI18n();
  const a = t.access;

  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  // Remembers what the visitor typed before, so the form prefills itself next
  // time — a reliable "fills itself" that doesn't depend on browser autofill.
  const [saved, setSaved] = useState({});

  // Listen for open requests from any CTA across the page.
  useEffect(() => {
    const onOpen = (e) => {
      setPlan(e.detail?.plan || '');
      setStatus('idle');
      let prev = {};
      try { prev = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { /* ignore */ }
      setSaved(prev);
      setOpen(true);
    };
    window.addEventListener(ACCESS_EVENT, onOpen);
    return () => window.removeEventListener(ACCESS_EVENT, onOpen);
  }, []);

  // Persist field values as the visitor types (kept on their own device).
  const persist = (e) => {
    try {
      const obj = Object.fromEntries(new FormData(e.currentTarget).entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch { /* ignore */ }
  };

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ENDPOINT) { setStatus('error'); return; }
    setStatus('sending');
    const data = new FormData(e.target);
    if (plan) data.append('plan', plan);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-overlay-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={a.title}
    >
      <div
        className="animate-modal-in relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1014] shadow-2xl shadow-black/60 max-h-[92vh] overflow-y-auto"
        style={{ fontFamily: 'Inter' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={a.close}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-7 sm:p-9">
          {status === 'success' ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full" style={{ backgroundColor: '#0B28FE' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-[26px] leading-tight font-extrabold text-white" style={{ fontFamily: 'Rubik' }}>
                {a.successTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/55">
                {a.successBody}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-7 px-7 py-2.5 rounded-full font-semibold text-white transition hover:brightness-110"
                style={{ backgroundColor: '#0B28FE' }}
              >
                {a.close}
              </button>
            </div>
          ) : (
            <>
              <img src={logo} alt="TrustBid" className="h-6 w-auto mb-6 select-none" />

              <h3 className="text-[28px] leading-[1.08] font-extrabold text-white" style={{ fontFamily: 'Rubik' }}>
                {a.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">{a.subtitle}</p>

              {plan && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#0B28FE]/12 text-[#9fb0ff] border border-[#0B28FE]/25">
                  {a.planLabel}: {plan}
                </div>
              )}

              <form onSubmit={handleSubmit} onInput={persist} className="mt-6 space-y-4">
                <Field label={a.name}>
                  <input name="name" type="text" required autoComplete="name" autoCapitalize="words" defaultValue={saved.name || ''} className={inputCls} />
                </Field>
                <Field label={a.org}>
                  <input name="organization" type="text" required autoComplete="organization" defaultValue={saved.organization || ''} className={inputCls} />
                </Field>
                <Field label={a.email}>
                  <input name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} defaultValue={saved.email || ''} className={inputCls} />
                </Field>
                <Field label={a.reasonLabel}>
                  <div className="relative">
                    <select
                      name="reason"
                      defaultValue={saved.reason || a.reasons[0]}
                      style={{ colorScheme: 'dark' }}
                      className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                    >
                      {a.reasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <svg
                      aria-hidden
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40"
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </Field>
                <Field label={a.commentLabel}>
                  <textarea name="comment" rows={2} className={`${inputCls} resize-none`} />
                </Field>

                {status === 'error' && (
                  <p className="text-sm text-red-400">{a.error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-3.5 rounded-full font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: '#0B28FE' }}
                >
                  {status === 'sending' ? a.sending : a.submit}
                </button>

                <p className="text-center text-xs text-white/40 pt-1">{a.note}</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
