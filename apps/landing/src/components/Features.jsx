// src/components/Features.jsx
import motionPattern from '../assets/motion-pattern.webp';
import { useI18n } from '../i18n/LanguageContext';

export default function Features() {
  const { t } = useI18n();
  return (
    <section className="bg-white text-gray-900 pt-24 pb-12 px-6">

      {/* Título y subtítulo principal */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          {t.features.title} <span className="text-blue-600">{t.features.titleHighlight}</span>
        </h2>
        <p className="text-gray-500 mt-4 text-lg">
          {t.features.subtitle}
        </p>
      </div>

      {/* CONTENEDOR DE LA TABLET CORREGIDO (Muestra la foto completa y real) */}
      <div className="max-w-4xl mx-auto flex justify-center">
        {/* Eliminamos el 'overflow-hidden' y el 'aspect-ratio' que recortaban la imagen */}
        <div className="relative max-w-2xl w-full flex justify-center items-center">
          
          {/* La imagen ahora es h-auto y object-contain para que se dibuje idéntica a tu archivo original */}
          <img 
            src={motionPattern} 
            alt="TrustBid Motion Pattern" 
            className="w-full h-auto object-contain drop-shadow-2xl select-none pointer-events-none"
          />
          
          {/* Text overlay with scrim for legibility over the pattern */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-black/30">
            <h3
              className="text-white select-none font-light leading-tight whitespace-pre-line"
              style={{ fontFamily: 'Inter', fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              {t.features.overlayTitle}
            </h3>
            <p className="text-white/80 mt-4 text-sm sm:text-base max-w-md">
              {t.features.overlaySub}
            </p>
          </div>

        </div>
      </div>

    </section>
  );
}