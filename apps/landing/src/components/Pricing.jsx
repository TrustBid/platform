// src/components/Pricing.jsx
import gradient from '../assets/gradient.webp';
import { openAccessModal } from '../lib/accessModal';
import { useI18n } from '../i18n/LanguageContext';

export default function Pricing() {
  const { t } = useI18n();
  const plans = t.pricing.plans;

  return (
    <section 
      className="w-full bg-cover bg-center text-white py-24 px-6 relative overflow-hidden"
      style={{backgroundImage: `url(${gradient})`}}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-white">{t.pricing.title}</h2>
          <p className="text-gray-300 mt-2">{t.pricing.subtitle}</p>
        </div>

        <div className="flex gap-6 lg:gap-8 mb-16 overflow-x-auto lg:overflow-visible overscroll-x-contain snap-x snap-mandatory lg:justify-center lg:items-stretch pb-4 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white text-gray-900 rounded-3xl p-8 shadow-2xl flex flex-col justify-between shrink-0 snap-center w-[80%] sm:w-[55%] lg:w-80"
            >
              <div>
                <h3 
                  className="text-2xl font-bold"
                  style={{color: '#001EFF'}}
                >
                  {plan.name}
                </h3>
                <p 
                  className="text-xs mt-1"
                  style={{color: '#797878'}}
                >
                  {plan.desc}
                </p>
                <p 
                  className="text-xs"
                  style={{color: '#797878'}}
                >
                  {plan.projects}
                </p>
                
                <div className="my-6 pb-6 border-b" style={{borderColor: '#0b28fe'}}>
                  <span className="text-4xl font-black text-black">{plan.price}</span>
                  {!plan.isCustom && <span className="text-gray-600 text-sm">{t.pricing.perMonth}</span>}
                  {plan.trial && (
                    <p className="text-xs font-semibold mt-2" style={{color: '#0B28FE'}}>{plan.trial}</p>
                  )}
                </div>

                <ul className="space-y-4 pt-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <div 
                        className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-full"
                        style={{backgroundColor: '#0B28FE'}}
                      >
                        <span className="text-white font-bold text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => openAccessModal({ plan: plan.name })}
                className={`mt-8 w-full py-3 rounded-full font-semibold transition ${
                  plan.name === 'Plus'
                    ? 'text-white hover:opacity-90'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
                style={plan.name === 'Plus' ? {backgroundColor: '#5044EF'} : {}}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-300 mt-8">{t.pricing.discount}</p>
      </div>
    </section>
  );
}