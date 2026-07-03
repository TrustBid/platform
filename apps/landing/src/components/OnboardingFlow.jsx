import { useEffect, useState, useCallback } from 'react';
import { ONBOARDING_EVENT } from '../lib/onboardingFlow';
import { openAccessModal } from '../lib/accessModal';
import LogoNav from '../assets/LogoNav.webp';
import motionPattern from '../assets/motion-pattern.webp';

const DAPP_REGISTER = import.meta.env.VITE_DAPP_URL
  ? `${import.meta.env.VITE_DAPP_URL}/register`
  : 'https://dapp-production-52e7.up.railway.app/register';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || '';
if (!FORMSPREE_ID) {
  console.warn('⚠️ VITE_FORMSPREE_ID not configured - contact form will not work');
}
const ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  admin:    ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  project:  ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0', 'M9 12h6M9 16h4'],
  finance:  ['M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  donor:    ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  developer:['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  solo:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  small:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  medium:   ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  large:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  trace:    ['M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
  report:   ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8M16 17H8M10 9H8'],
  audit:    ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  all:      ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  social:   ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'],
  web:      ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  referral: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  event:    ['M8 2v4M16 2v4M3 10h18M21 8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z'],
  stellar:  ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  check:    'M20 6 9 17l-5-5',
};

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'role',
    title: '¿Cuál es tu rol?',
    subtitle: 'Personalizamos tu experiencia según cómo usas TrustBid.',
    type: 'cards',
    cols: 2,
    options: [
      { value: 'admin', label: 'Administrador / Director', icon: 'admin' },
      { value: 'project', label: 'Responsable de proyecto', icon: 'project' },
      { value: 'finance', label: 'Contador / Finanzas', icon: 'finance' },
      { value: 'donor', label: 'Donante o verificador', icon: 'donor' },
      { value: 'developer', label: 'Desarrollador (API)', icon: 'developer' },
    ],
  },
  {
    id: 'org',
    title: 'Tu organización',
    subtitle: 'Cuéntanos brevemente dónde trabajas.',
    type: 'form',
    fields: [
      { name: 'orgName', label: 'Nombre de la organización', type: 'text', required: true, placeholder: 'Ej. Fundación Tierra Viva' },
      { name: 'country', label: 'País', type: 'select', required: true,
        options: ['Colombia','México','Argentina','Perú','Chile','Ecuador','Bolivia','Venezuela','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua','Panamá','Paraguay','Uruguay','República Dominicana','Otro'] },
      { name: 'orgType', label: 'Tipo de organización', type: 'select', required: true,
        options: ['ONG / Organización sin fines de lucro','Fundación','Cooperativa','Empresa social','Gobierno / entidad pública','Otro'] },
    ],
  },
  {
    id: 'team',
    title: '¿Cuántas personas gestionarán fondos?',
    subtitle: 'Para recomendarte el plan más adecuado.',
    type: 'cards',
    cols: 2,
    options: [
      { value: '1', label: 'Solo yo', icon: 'solo' },
      { value: '2-5', label: '2 a 5 personas', icon: 'small' },
      { value: '6-20', label: '6 a 20 personas', icon: 'medium' },
      { value: '20+', label: 'Más de 20', icon: 'large' },
    ],
  },
  {
    id: 'purpose',
    title: '¿Para qué usarás TrustBid?',
    subtitle: 'Puedes elegir más de uno.',
    type: 'cards',
    cols: 2,
    multi: true,
    options: [
      { value: 'trace', label: 'Trazabilidad de fondos', icon: 'trace' },
      { value: 'report', label: 'Reportes para donantes', icon: 'report' },
      { value: 'audit', label: 'Cumplimiento y auditoría', icon: 'audit' },
      { value: 'all', label: 'Todo lo anterior', icon: 'all' },
    ],
  },
  {
    id: 'plan',
    title: 'Elige tu plan',
    subtitle: 'Puedes cambiar en cualquier momento. Sin tarjeta de crédito para el plan gratuito.',
    type: 'plans',
  },
  {
    id: 'source',
    title: '¿Cómo nos conociste?',
    subtitle: 'Nos ayuda a llegar a más organizaciones como la tuya.',
    type: 'cards',
    cols: 2,
    options: [
      { value: 'social', label: 'Redes sociales', icon: 'social' },
      { value: 'web', label: 'Google / búsqueda web', icon: 'web' },
      { value: 'referral', label: 'Un colega o referido', icon: 'referral' },
      { value: 'event', label: 'Evento o conferencia', icon: 'event' },
      { value: 'stellar', label: 'Comunidad Stellar', icon: 'stellar' },
    ],
  },
  {
    id: 'contact',
    title: 'Casi listo',
    subtitle: 'Solo necesitamos un nombre y un correo para crear tu cuenta.',
    type: 'form',
    fields: [
      { name: 'name', label: 'Tu nombre', type: 'text', required: true, placeholder: 'Nombre completo' },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true, placeholder: 'tu@organizacion.org' },
    ],
  },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mes',
    desc: 'Para comenzar sin compromiso',
    features: ['Hasta 2 proyectos', 'Dashboard básico', 'Registro de transacciones', 'Trazabilidad blockchain'],
    cta: 'Comenzar gratis',
    highlight: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: '/mes',
    desc: 'Para organizaciones pequeñas',
    features: ['Hasta 5 proyectos', 'Reportes automáticos', 'Panel en tiempo real', 'Soporte por email'],
    cta: 'Elegir Basic',
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$14.99',
    period: '/mes',
    desc: 'Para ONG en crecimiento',
    features: ['Hasta 15 proyectos', 'Reportes multiformato', 'AI Transaction Guard', 'Integraciones'],
    cta: 'Elegir Plus',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    desc: 'Para grandes organizaciones',
    features: ['Proyectos ilimitados', 'Acceso a API pública', 'Soporte dedicado', 'Capacitación'],
    cta: 'Contactar',
    highlight: false,
  },
];

// ── CSS classes ───────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 outline-none focus:border-[#0B28FE] focus:ring-2 focus:ring-[#0B28FE]/15 transition';

const selectCls =
  'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 ' +
  'outline-none focus:border-[#0B28FE] focus:ring-2 focus:ring-[#0B28FE]/15 transition appearance-none cursor-pointer';

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState('next'); // 'next' | 'prev'
  const [animKey, setAnimKey] = useState(0);
  const [data, setData] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true);
      setStepIdx(0);
      setData({});
      setStatus('idle');
      // Si viene con plan pre-seleccionado (desde pricing Free)
      if (e.detail?.plan) {
        setData({ plan: e.detail.plan });
        setStepIdx(0); // igual empieza desde el principio
      }
    };
    window.addEventListener(ONBOARDING_EVENT, onOpen);
    return () => window.removeEventListener(ONBOARDING_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const goTo = useCallback((idx, direction = 'next') => {
    setDir(direction);
    setAnimKey((k) => k + 1);
    setStepIdx(idx);
  }, []);

  const canAdvance = useCallback(() => {
    const step = STEPS[stepIdx];
    if (step.type === 'cards') {
      if (step.multi) return (data[step.id] || []).length > 0;
      return !!data[step.id];
    }
    if (step.type === 'plans') return !!data.plan;
    if (step.type === 'form') {
      return step.fields.filter(f => f.required).every(f => data[f.name]?.trim());
    }
    return true;
  }, [stepIdx, data]);

  const handleCardToggle = (stepId, value, multi) => {
    if (multi) {
      const cur = data[stepId] || [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      setData(d => ({ ...d, [stepId]: next }));
    } else {
      setData(d => ({ ...d, [stepId]: value }));
    }
  };

  const handleFieldChange = (name, value) => {
    setData(d => ({ ...d, [name]: value }));
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (stepIdx < STEPS.length - 1) {
      goTo(stepIdx + 1, 'next');
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) goTo(stepIdx - 1, 'prev');
  };

  const handleSubmit = async () => {
    setStatus('sending');
    const plan = data.plan || 'free';

    // Para planes de pago: cierra el onboarding y abre el AccessModal pre-relleno
    if (plan !== 'free') {
      setOpen(false);
      openAccessModal({
        plan,
        prefill: {
          name: data.name || '',
          organization: data.orgName || '',
          email: data.email || '',
        },
      });
      return;
    }

    // Plan free: envía a Formspree y redirige al registro
    const body = new FormData();
    body.append('plan', plan);
    Object.entries(data).forEach(([k, v]) => {
      if (v) body.append(k, Array.isArray(v) ? v.join(', ') : v);
    });

    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body, headers: { Accept: 'application/json' } });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!open) return null;

  const step = STEPS[stepIdx];
  const progress = ((stepIdx) / (STEPS.length - 1)) * 100;
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ animation: 'overlayIn 0.2s ease-out' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: 'modalIn 0.35s cubic-bezier(0.16,1,0.3,1)', fontFamily: 'Inter' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Texture overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ backgroundImage: `url(${motionPattern})`, backgroundSize: 'cover', opacity: 0.025 }}
        />

        {/* Progress bar */}
        <div className="relative h-1 bg-gray-100 rounded-t-3xl overflow-hidden shrink-0">
          <div
            className="h-full bg-[#0B28FE] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-7 pt-5 pb-4 shrink-0">
          <img src={LogoNav} alt="TrustBid" className="h-5 w-auto" />
          <span className="text-xs font-medium text-gray-400">
            {stepIdx + 1} de {STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-7 pb-7">
          {status === 'success' ? (
            <SuccessState onClose={() => { setOpen(false); window.location.href = DAPP_REGISTER; }} />
          ) : (
            <div key={`${stepIdx}-${animKey}`} style={{ animation: `slideIn${dir === 'next' ? 'Right' : 'Left'} 0.32s cubic-bezier(0.16,1,0.3,1)` }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Rubik' }}>{step.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{step.subtitle}</p>
              </div>

              {step.type === 'cards' && (
                <CardStep step={step} data={data} onToggle={handleCardToggle} />
              )}
              {step.type === 'form' && (
                <FormStep step={step} data={data} onChange={handleFieldChange} inputCls={inputCls} selectCls={selectCls} />
              )}
              {step.type === 'plans' && (
                <PlanStep plans={PLANS} selected={data.plan} onSelect={v => setData(d => ({ ...d, plan: v }))} />
              )}

              {status === 'error' && (
                <p className="mt-4 text-sm text-red-500 font-medium">Algo salió mal. Intenta de nuevo.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {status !== 'success' && (
          <div className="relative flex items-center justify-between px-7 py-5 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIdx === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-0 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
              </svg>
              Atrás
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance() || status === 'sending'}
              className="flex items-center gap-2 px-7 py-2.5 rounded-full font-semibold text-white text-sm transition disabled:opacity-40 hover:brightness-110"
              style={{ backgroundColor: '#0B28FE' }}
            >
              {status === 'sending' ? 'Enviando…' : isLast ? 'Crear mi cuenta' : 'Continuar'}
              {!isLast && status !== 'sending' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function CardStep({ step, data, onToggle }) {
  const isMulti = step.multi;
  const selected = isMulti ? (data[step.id] || []) : data[step.id];

  const isActive = (value) => isMulti ? selected.includes(value) : selected === value;

  return (
    <div className={`grid gap-3 ${step.cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {step.options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onToggle(step.id, opt.value, isMulti)}
          className={[
            'flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
            isActive(opt.value)
              ? 'border-[#0B28FE] bg-[#0B28FE]/5 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          <span className={['p-2 rounded-xl', isActive(opt.value) ? 'bg-[#0B28FE]/10 text-[#0B28FE]' : 'bg-gray-100 text-gray-500'].join(' ')}>
            <Icon d={ICONS[opt.icon]} size={18} />
          </span>
          <span className={['text-sm font-semibold', isActive(opt.value) ? 'text-[#0B28FE]' : 'text-gray-800'].join(' ')}>
            {opt.label}
          </span>
          {isActive(opt.value) && (
            <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-[#0B28FE] flex items-center justify-center">
              <Icon d={ICONS.check} size={12} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function FormStep({ step, data, onChange, inputCls, selectCls }) {
  return (
    <div className="space-y-4">
      {step.fields.map(field => (
        <label key={field.name} className="block">
          <span className="block mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {field.label}
          </span>
          {field.type === 'select' ? (
            <div className="relative">
              <select
                className={selectCls}
                value={data[field.name] || ''}
                onChange={e => onChange(field.name, e.target.value)}
              >
                <option value="">Selecciona una opción</option>
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          ) : (
            <input
              type={field.type}
              placeholder={field.placeholder}
              className={inputCls}
              value={data[field.name] || ''}
              onChange={e => onChange(field.name, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}

function PlanStep({ plans, selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {plans.map(plan => {
        const active = selected === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={[
              'flex flex-col text-left p-5 rounded-2xl border-2 transition-all relative overflow-hidden',
              active
                ? 'border-[#0B28FE] bg-[#0B28FE]/5 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              plan.highlight && !active ? 'border-gray-300 bg-gray-50/80' : '',
            ].join(' ')}
          >
            {plan.highlight && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#0B28FE', color: 'white' }}>
                Popular
              </span>
            )}
            <span className={['text-base font-bold', active ? 'text-[#0B28FE]' : 'text-gray-900'].join(' ')} style={{ fontFamily: 'Rubik' }}>
              {plan.name}
            </span>
            <div className="flex items-baseline gap-0.5 mt-1 mb-3">
              <span className={['text-2xl font-black', active ? 'text-[#0B28FE]' : 'text-gray-900'].join(' ')}>
                {plan.price}
              </span>
              {plan.period && <span className="text-xs text-gray-400">{plan.period}</span>}
            </div>
            <ul className="space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={['w-4 h-4 rounded-full flex items-center justify-center shrink-0', active ? 'bg-[#0B28FE]' : 'bg-gray-200'].join(' ')}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#6b7280'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

function SuccessState({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: '#0B28FE' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Rubik' }}>
        Bienvenido a TrustBid
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-7">
        Tu cuenta gratuita está lista. Te redirigimos para que conectes tu wallet y comiences.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="px-8 py-3 rounded-full font-semibold text-white text-sm hover:brightness-110 transition"
        style={{ backgroundColor: '#0B28FE' }}
      >
        Crear mi cuenta
      </button>
    </div>
  );
}
