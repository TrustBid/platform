import gradient from '../assets/gradient.webp';
import { useI18n } from '../i18n/LanguageContext';

function CheckCircle() {
  return (
    <span
      className="flex h-[25px] w-[25px] flex-shrink-0 items-center justify-center rounded-full bg-[#4338CA]"
      aria-hidden="true"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function PricingCard({ plan, isFeatured, onCtaClick }) {
  return (
    <article className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_0_67px_rgba(0,0,0,0.25)] sm:p-7">
      <h3
        className="text-[35px] font-medium leading-tight text-[#4338CA]"
        style={{ fontFamily: 'Outfit' }}
      >
        {plan.name}
      </h3>

      <p
        className="mt-2 text-lg font-light leading-snug text-[#797878]"
        style={{ fontFamily: 'Inter' }}
      >
        {plan.desc}
        <br />
        {plan.projects}
      </p>

      <div className="mt-6">
        {plan.isCustom ? (
          <p
            className="text-[50px] font-medium leading-none text-black"
            style={{ fontFamily: 'Outfit' }}
          >
            {plan.price}
          </p>
        ) : (
          <p
            className="text-[50px] font-medium leading-none text-black"
            style={{ fontFamily: 'Outfit' }}
          >
            {plan.price}
            <span className="text-2xl font-light text-[#797878]">{plan.perMonth}</span>
          </p>
        )}

        {plan.trial && (
          <p
            className="mt-2 text-sm font-medium text-[#4338CA]"
            style={{ fontFamily: 'Inter' }}
          >
            {plan.trial}
          </p>
        )}
      </div>

      <hr className="my-6 border-t border-[#0B28FE]/60" />

      <ul className="mb-8 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <CheckCircle />
            <span
              className="text-lg font-light text-[#797878]"
              style={{ fontFamily: 'Inter' }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCtaClick}
        className={`w-full rounded-full px-6 py-2.5 text-center text-xl font-medium text-white transition-opacity hover:opacity-90 ${
          isFeatured ? 'bg-[#5B5FEF]' : 'bg-black'
        }`}
        style={{ fontFamily: 'Outfit' }}
      >
        {plan.cta}
      </button>
    </article>
  );
}

export default function PricingDetails() {
  const { t } = useI18n();
  const { title, subtitle, perMonth, discount, plans } = t.pricing;

  const handleBasicTrial = () => {
    // placeholder — connect free trial checkout
  };

  const handlePlusStart = () => {
    // placeholder — connect Plus checkout
  };

  const handleEnterpriseContact = () => {
    // placeholder — connect contact sales flow
  };

  const ctaHandlers = [handleBasicTrial, handlePlusStart, handleEnterpriseContact];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#02040a] bg-cover bg-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{ backgroundImage: `url(${gradient})` }}
    >
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <header className="mb-12 text-center sm:mb-16">
          <h2
            className="text-[clamp(36px,5vw,50px)] font-medium leading-tight text-white"
            style={{ fontFamily: 'Outfit' }}
          >
            {title}
          </h2>
          <p
            className="mx-auto mt-4 max-w-3xl text-lg font-light text-white/90 sm:text-xl"
            style={{ fontFamily: 'Inter' }}
          >
            {subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={{ ...plan, perMonth }}
              isFeatured={index === 1}
              onCtaClick={ctaHandlers[index]}
            />
          ))}
        </div>

        <p
          className="mt-12 text-center text-lg text-white sm:mt-16 sm:text-xl"
          style={{ fontFamily: 'Inter' }}
        >
          {discount}
        </p>
      </div>
    </section>
  );
}
