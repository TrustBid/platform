import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';

// Per-step illustrative icon (stroke SVG) shown in the visual panel.
const StepVisual = ({ n }) => {
  const icons = {
    1: <><rect x="14" y="22" width="44" height="32" rx="6" /><path d="M14 32h44" /><circle cx="48" cy="44" r="4" /></>,
    2: <><path d="M22 18h28a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4Z" /><path d="M26 30h20M26 38h20M26 46h12" /></>,
    3: <><path d="M24 18h20l10 10v26a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4Z" /><path d="M44 18v10h10M28 42l6 6 10-12" /></>,
  };
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
      stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {icons[n]}
    </svg>
  );
};

const SIZE = 760, CX = 380, CY = 380, R = 308, SW = 72;
const C   = 2 * Math.PI * R;
const GAP = 30, SEG = C / 3 - GAP;

// ── Mobile wheel (full ring, centered, smaller) ──
const M_SIZE = 280, M_CX = 140, M_CY = 140, M_R = 108, M_SW = 26;
const M_C    = 2 * Math.PI * M_R;
const M_GAP  = 16, M_SEG = M_C / 3 - M_GAP;
// Badge i starts at top (-90°), then every 120° clockwise.
const M_BADGES = [0, 1, 2].map((i) => {
  const rad = ((-90 + i * 120) * Math.PI) / 180;
  return { n: i + 1, x: M_CX + M_R * Math.cos(rad), y: M_CY + M_R * Math.sin(rad) };
});

// Base screen-angles (clockwise from 3 o'clock). Chosen so that after a CLOCKWISE
// rotation of step*120°, badge (step+1) lands at 0° (3-o'clock, the visible half).
// index 0 = badge 1
const BADGE_ANGLES = [0, 240, 120];

export default function HowItWorks() {
  const { t } = useI18n();
  const steps = t.howItWorks.steps;
  const sectionRef  = useRef(null);
  const wheelRef    = useRef(null);
  const headerRef   = useRef(null);
  const contentRefs = useRef([]);
  const badgeRefs   = useRef([]);

  // Mobile carousel state
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);
  const goTo = (i) => setActive(Math.max(0, Math.min(2, i)));
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const { top, height } = sectionRef.current.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      const progress   = Math.max(0, Math.min(1, -top / scrollable));
      const intro      = progress < 0.18;

      // Header
      if (headerRef.current) {
        headerRef.current.style.opacity      = intro ? '1' : '0';
        headerRef.current.style.pointerEvents = intro ? 'auto' : 'none';
      }

      if (intro) {
        if (wheelRef.current) wheelRef.current.style.transform = 'rotate(0deg)';
        badgeRefs.current.forEach(el => { if (el) el.style.transform = 'rotate(0deg)'; });
        contentRefs.current.forEach(el => {
          if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(-50%) translateY(20px)'; }
        });
        return;
      }

      // step = 0,1,2 maps to badge 1,2,3 arriving at 3-o'clock (clockwise spin)
      const step     = Math.min(Math.floor(((progress - 0.18) / 0.82) * 3), 2);
      const rotation = step * 120; // positive = clockwise

      if (wheelRef.current)
        wheelRef.current.style.transform = `rotate(${rotation}deg)`;

      // Counter-rotate badges so the numbers always stay upright
      badgeRefs.current.forEach(el => {
        if (el) el.style.transform = `rotate(${-rotation}deg)`;
      });

      contentRefs.current.forEach((el, i) => {
        if (!el) return;
        const active = i === step;
        el.style.opacity   = active ? '1' : '0';
        el.style.transform = active
          ? 'translateY(-50%) translateY(0px)'
          : 'translateY(-50%) translateY(20px)';
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Badge screen positions within the wheel div
  const badges = BADGE_ANGLES.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    return { n: i + 1, x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
  });

  return (
    <section ref={sectionRef} id="how-it-works" className="relative bg-white lg:h-[400vh]">
      {/* ── Desktop: scroll-driven wheel ─────────────────── */}
      <div className="hidden lg:block sticky top-0 h-screen overflow-hidden">

        {/* ── Wheel (ring + badges rotate together) ─────── */}
        <div style={{
          position: 'absolute',
          left: -CX,          // center the circle on the left edge → only right half shows
          top: '50%',
          marginTop: -CY,
          width: SIZE,
          height: SIZE,
        }}>
          <div
            ref={wheelRef}
            style={{
              width: SIZE, height: SIZE,
              transformOrigin: 'center center',
              transform: 'rotate(0deg)',
              transition: 'transform 0.9s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
            }}
          >
            {/* SVG segmented ring */}
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', inset: 0 }}>
              <circle
                cx={CX} cy={CY} r={R}
                fill="none" stroke="#1d4ed8" strokeWidth={SW}
                strokeDasharray={`${SEG} ${GAP}`}
                strokeDashoffset={SEG / 2}
              />
            </svg>

            {/* Badges (rotate with ring) */}
            {badges.map(b => (
              <div
                key={b.n}
                ref={el => (badgeRefs.current[b.n - 1] = el)}
                style={{
                  position: 'absolute',
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'white', border: '5px solid #1d4ed8',
                  left: b.x - 45, top: b.y - 45,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, fontWeight: 700, color: '#1d4ed8',
                  userSelect: 'none',
                  transformOrigin: 'center center',
                  transition: 'transform 0.9s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {b.n}
              </div>
            ))}
          </div>
        </div>

        {/* ── Intro header ────────────────────────────────── */}
        <div
          ref={headerRef}
          style={{
            position: 'absolute', right: 80, top: '50%',
            transform: 'translateY(-50%)', maxWidth: 400,
            transition: 'opacity 0.45s ease',
          }}
        >
          <h2 style={{ fontSize: 64, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.05, margin: 0 }}>
            {t.howItWorks.title} <span style={{ color: '#1d4ed8' }}>{t.howItWorks.titleHighlight}</span>
          </h2>
          <p style={{ marginTop: 16, fontSize: 17, color: '#6b7280', lineHeight: 1.65 }}>
            {t.howItWorks.intro}
          </p>
        </div>

        {/* ── Step content panels ─────────────────────────── */}
        {steps.map((step, i) => (
          <div
            key={i}
            ref={el => contentRefs.current[i] = el}
            style={{
              position: 'absolute',
              left: '32%', top: '50%',
              transform: 'translateY(-50%) translateY(20px)',
              opacity: 0,
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              display: 'flex', alignItems: 'center', gap: 48,
              width: '65%',
            }}
          >
            {/* Badge + text */}
            <div style={{ flex: '0 0 280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '4px solid #1d4ed8', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#1d4ed8',
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>
                  {step.title}
                </h3>
              </div>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                {step.desc}
              </p>
            </div>

            {/* Step visual */}
            <div style={{
              flex: 1, minHeight: 240,
              border: '1.5px solid #e5e7eb', borderRadius: 12,
              background: 'linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <StepVisual n={i + 1} />
              <span style={{ color: '#1d4ed8', fontSize: 14, fontWeight: 600 }}>
                {step.title}
              </span>
            </div>
          </div>
        ))}

      </div>

      {/* ── Mobile / tablet: wheel carousel (tap/swipe) ── */}
      <div
        className="lg:hidden px-6 py-20"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            {t.howItWorks.title} <span className="text-blue-700">{t.howItWorks.titleHighlight}</span>
          </h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            {t.howItWorks.intro}
          </p>

          {/* Rotating wheel */}
          <div className="relative mx-auto mt-12" style={{ width: M_SIZE, height: M_SIZE, maxWidth: '100%' }}>
            <div
              style={{
                width: M_SIZE, height: M_SIZE,
                transformOrigin: 'center center',
                transform: `rotate(${-active * 120}deg)`,
                transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
              }}
            >
              <svg width={M_SIZE} height={M_SIZE} viewBox={`0 0 ${M_SIZE} ${M_SIZE}`} style={{ position: 'absolute', inset: 0 }}>
                <circle
                  cx={M_CX} cy={M_CY} r={M_R}
                  fill="none" stroke="#1d4ed8" strokeWidth={M_SW}
                  strokeDasharray={`${M_SEG} ${M_GAP}`}
                  strokeDashoffset={M_SEG / 2}
                />
              </svg>

              {M_BADGES.map((b, i) => (
                <button
                  key={b.n}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Step ${b.n}`}
                  style={{
                    position: 'absolute',
                    width: 64, height: 64, borderRadius: '50%',
                    background: active === i ? '#1d4ed8' : 'white',
                    color: active === i ? 'white' : '#1d4ed8',
                    border: '4px solid #1d4ed8',
                    left: b.x - 32, top: b.y - 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 700,
                    transformOrigin: 'center center',
                    transform: `rotate(${active * 120}deg)`,
                    transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, color 0.3s ease',
                    cursor: 'pointer',
                  }}
                >
                  {b.n}
                </button>
              ))}
            </div>
          </div>

          {/* Active step content */}
          <div className="mt-10 min-h-[150px]">
            <div className="flex items-center justify-center gap-3 mb-3">
              <StepVisual n={active + 1} />
              <h3 className="text-blue-700 font-bold text-2xl">{steps[active].title}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-[15px] max-w-sm mx-auto">
              {steps[active].desc}
            </p>
          </div>

          {/* Dots */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  active === i ? 'w-7 bg-blue-700' : 'w-2.5 bg-blue-200'
                }`}
              />
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-400 select-none">{t.howItWorks.hint}</p>
        </div>
      </div>
    </section>
  );
}
