import React, { useState } from 'react';
import { openAccessModal } from '../lib/accessModal';
import { useI18n } from '../i18n/LanguageContext';

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/trustbidapp/' },
  { label: 'X', href: 'https://x.com/TrustBidApp' },
  { label: 'Instagram', href: 'https://www.instagram.com/trustbid_/' },
];

const socialIcons = {
  LinkedIn: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6C1.12 6 0 4.88 0 3.5C0 2.12 1.12 1 2.5 1C3.88 1 4.98 2.12 4.98 3.5ZM0.5 8H4.5V24H0.5V8ZM8.5 8H12.1V10.4H12.2C12.9 9 14.8 7.8 17.3 7.8C22.1 7.8 24 10.7 24 15.5V24H20V16C20 14.7 20 12.9 17.7 12.9C15.4 12.9 15 14.5 15 15.9V24H11V8H8.5Z" />
    </svg>
  ),
  X: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Instagram: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  ),
};

export default function Pricing() {
  const { t } = useI18n();
  const [teamSize, setTeamSize] = useState(5);

  // Lógica de cálculo interactiva
  const hoursSavedMonth = teamSize * 8;
  const hoursSavedYear = hoursSavedMonth * 12;

  return (
    <section
      id="pricing"
      className="w-full bg-[#FFFFFF] py-20 px-4 font-sans text-black relative block clear-both"
    >
      <div className="max-w-[850px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">
            More <span className="text-[#0026ff]">transparency</span>. Less manual work.
          </h2>
          <p className="mt-2 text-gray-600 text-base md:text-lg">
            Automate your reporting. Cut weeks of reconciliation to minutes.
          </p>
        </div>

        {/* Tarjeta contenedora azul del diseño de la imagen */}
        <div className="border border-[#0026ff]/40 rounded-[24px] p-6 md:p-8 mb-6 bg-white shadow-sm">
          
          {/* Listas: TOOLS YOU REPLACE vs GAINS YOU UNLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            
            {/* Tools You Replace */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-black mb-4">
                TOOLS YOU REPLACE
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Manual Excel Reporting</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Weekly Reconciliation Calls</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Multi-Format Report Generation</span>
                </li>
              </ul>
            </div>

            {/* Gains You Unlock */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-black mb-4">
                GAINS YOU UNLOCK
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Donor Status Updates</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Real-Time Fund Traceability</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <div className="w-4 h-4 border border-gray-400 rounded bg-white flex-shrink-0" />
                  <span>Tamper-Proof Audit Trail</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Línea divisoria interna */}
          <hr className="border-t border-gray-200 my-6" />

          {/* Sección: YOUR ORGANIZATION */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-black mb-4">
              YOUR ORGANIZATION
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              
              {/* Selector de tamaño de equipo */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs text-gray-600 font-bold">Team Size</label>
                <div className="relative w-full">
                  <select 
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full bg-[#0026ff] text-white font-black px-4 py-3 rounded-lg appearance-none cursor-pointer focus:outline-none pr-10 text-lg shadow-sm"
                  >
                    <option value={5}>5</option>
                    <option value={15}>15</option>
                    <option value={35}>35</option>
                    <option value={75}>75</option>
                    <option value={150}>100+</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-0.5 text-white text-[9px]">
                    <span>▲</span>
                    <span>▼</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta Horas al mes */}
              <div className="border border-[#0026ff]/40 rounded-lg p-4 bg-white min-h-[110px] flex flex-col justify-between shadow-sm">
                <p className="text-xs font-bold text-black leading-tight">Hours saved per month</p>
                <p className="text-4xl font-black text-black tracking-tight">{hoursSavedMonth}</p>
              </div>

              {/* Tarjeta Horas al año */}
              <div className="border border-[#0026ff]/40 rounded-lg p-4 bg-white min-h-[110px] flex flex-col justify-between shadow-sm">
                <p className="text-xs font-bold text-black leading-tight">Annual hours saved</p>
                <p className="text-4xl font-black text-black tracking-tight">{hoursSavedYear}</p>
              </div>

            </div>
          </div>

        </div>

        {/* Botones de acción inferiores */}
        <div className="flex justify-end gap-3 mb-10">
          <a
            href="#pricing-details"
            className="px-6 py-2.5 border border-[#0026ff] text-[#0026ff] rounded-full font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            See pricing plans
          </a>
          <button
            type="button"
            onClick={() => openAccessModal({ source: 'pricing-cta' })}
            className="px-6 py-2.5 bg-[#0026ff] text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
          >
            Request a Demo
          </button>
        </div>

        {/* Separador azul completo */}
        <hr className="border-t-2 border-[#0026ff] w-full mb-6" />

        {/* Footer */}
        <div className="text-center flex flex-col items-center gap-4">
          <span className="text-[#0026ff] font-bold text-lg">Stay connected</span>
          
          <div className="flex items-center gap-6 text-[#4a72ff]">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-800 transition-colors"
              >
                {socialIcons[item.label]}
              </a>
            ))}
          </div>

          <p className="text-[#0026ff] text-xs font-semibold mt-2 tracking-wide">
            TrustBid is building the infrastructure for transparent social funding with Stellar.
          </p>
        </div>

      </div>
    </section>
  );
}