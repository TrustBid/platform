import gradient from '../assets/gradient.webp';
import { openAccessModal } from '../lib/accessModal';
import { openOnboarding } from '../lib/onboardingFlow';
import { useI18n } from '../i18n/LanguageContext';

const FREE_PLAN = {
  en: {
    name: 'Free',
    desc: 'Get started with no commitment',
    projects: 'Up to 2 projects',
    price: '$0',
    isCustom: false,
    features: ['Up to 2 projects', 'Basic dashboard', 'Transaction log', 'Blockchain traceability'],
    cta: 'Start for free',
    isFree: true,
  },
  es: {
    name: 'Free',
    desc: 'Comienza sin compromiso',
    projects: 'Hasta 2 proyectos',
    price: '$0',
    isCustom: false,
    features: ['Hasta 2 proyectos', 'Dashboard básico', 'Registro de transacciones', 'Trazabilidad blockchain'],
    cta: 'Comenzar gratis',
    isFree: true,
  },
};

export default function Pricing() {
  const { t, lang } = useI18n();
  const paidPlans = t.pricing.plans.map(p => ({ ...p, isFree: false }));
  const freePlan = FREE_PLAN[lang] || FREE_PLAN.es;
  const plans = [freePlan, ...paidPlans];

  const handlePlanClick = (plan) => {
    if (plan.isFree) {
      openOnboarding({ source: 'pricing', plan: 'free' });
    } else {
      openAccessModal({ plan: plan.name });
    }
  };

  return (
    <section
      id="pricing"
      className="w-full bg-cover bg-center text-white py-24 px-6 relative overflow-hidden"
      style={{ backgroundImage: `url(${gradient})` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-white">{t.pricing.title}</h2>
          <p className="text-gray-300 mt-2">{t.pricing.subtitle}</p>
        </div>

        <div className="flex gap-6 lg:gap-6 mb-16 overflow-x-auto lg:overflow-visible overscroll-x-contain snap-x snap-mandatory lg:justify-center lg:items-stretch pb-4 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {plans.map((plan) => {
            const isPlus = plan.name === 'Plus';
            return (
              <div
                key={plan.name}
                className="bg-white text-gray-900 rounded-3xl p-7 shadow-2xl flex flex-col justify-between shrink-0 snap-center w-[78%] sm:w-[52%] lg:w-72 relative"
              >
                {isPlus && (
                  <span className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#0B28FE' }}>
                    Popular
                  </span>
                )}
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: '#001EFF' }}>{plan.name}</h3>
                  <p className="text-xs mt-1" style={{ color: '#797878' }}>{plan.desc}</p>
                  <p className="text-xs" style={{ color: '#797878' }}>{plan.projects}</p>

                  <div className="my-6 pb-6 border-b" style={{ borderColor: '#0b28fe' }}>
                    <span className="text-4xl font-black text-black">{plan.price}</span>
                    {!plan.isCustom && (
                      <span className="text-gray-600 text-sm">{t.pricing.perMonth}</span>
                    )}
                    {plan.trial && (
                      <p className="text-xs font-semibold mt-2" style={{ color: '#0B28FE' }}>{plan.trial}</p>
                    )}
                    {plan.isFree && (
                      <p className="text-xs font-semibold mt-2 text-emerald-600">Sin tarjeta de crédito</p>
                    )}
                  </div>

                  <ul className="space-y-3.5 pt-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-full" style={{ backgroundColor: '#0B28FE' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`mt-8 w-full py-3 rounded-full font-semibold transition ${
                    isPlus
                      ? 'text-white hover:opacity-90'
                      : plan.isFree
                      ? 'border-2 hover:bg-gray-50'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  style={
                    isPlus
                      ? { backgroundColor: '#5044EF' }
                      : plan.isFree
                      ? { borderColor: '#0B28FE', color: '#0B28FE', backgroundColor: 'transparent' }
                      : {}
                  }
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-300 mt-8">{t.pricing.discount}</p>
      </div>
    </section>
  );
}
