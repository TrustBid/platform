import { useState } from 'react';
import gradient from '../assets/gradient.webp';
import { useI18n } from '../i18n/LanguageContext';

export default function FAQ() {
  const { t } = useI18n();
  // Estado para controlar qué pregunta está abierta (guarda el índice)
  const [openIndex, setOpenIndex] = useState(0); // La primera abierta por defecto como en el diseño

  const faqs = t.faq.items;

  return (
    <section
      id="faq"
      className="w-full bg-cover bg-center text-white pt-16 pb-16 px-6 relative overflow-hidden"
      style={{backgroundImage: `url(${gradient})`, minHeight: 'auto'}}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Lado Izquierdo: Título */}
        <div className="flex flex-col justify-center max-w-md h-full">
          <h2
            className="font-medium leading-tight text-[clamp(32px,5vw,50px)]"
            style={{ fontFamily: 'Outfit', fontWeight: 500 }}
          >
            {t.faq.title}
          </h2>
        </div>

        {/* Lado Derecho: Acordeón de preguntas */}
        <div className="space-y-0">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="border-b transition-all duration-300"
                style={{borderColor: '#0b28fe'}}
              >
                <button
                  className="w-full flex items-center justify-between text-left py-4 gap-4 hover:text-blue-300 transition-colors"
                  style={{fontFamily: 'Inter'}}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span
                    className="text-white font-light text-base sm:text-lg"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {faq.question}
                  </span>
                  <span
                    className="text-white flex-shrink-0 font-semibold text-3xl leading-none"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                
                {/* Contenido desplegable con animación simple */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[300px] opacity-100 mb-4' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p 
                    className="text-gray-300 text-sm leading-relaxed pr-6"
                    style={{fontFamily: 'Inter'}}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* PENDIENTE: "See more / Ver más" ocultado — no hay página de FAQ
              completa todavía. Reactivar cuando exista. Ver PENDIENTES.md */}
        </div>

      </div>
    </section>
  );
}