// src/components/TrustLayer.jsx

import patternBg from "../assets/Layer.webp";
import { useI18n } from "../i18n/LanguageContext";

const DAPP_BASE = import.meta.env.VITE_DAPP_URL || 'https://dapp-production-52e7.up.railway.app';

export default function TrustLayer() {
  const { t } = useI18n();
  const d = t.trustLayer.dashboard;
  return (
    <section id="about" className="w-full bg-white py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">

        {/* ======================================================
            LEFT SIDE
        ====================================================== */}
        <div className="relative flex justify-center items-center">

          {/* BLUE BACKGROUND */}
          <div
            className="
              relative
              w-[360px]
              max-w-[88vw]
              h-[280px]

              sm:w-[460px]
              sm:h-[320px]

              md:w-[580px]
              md:h-[380px]

              lg:w-[700px]
              lg:h-[440px]

              rounded-[42px]
              overflow-hidden
            "
          >
            <img
              src={patternBg}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* ======================================================
              PHONE
          ====================================================== */}
          <div
            className="
              absolute
              z-10

              w-[180px]
              h-[370px]

              sm:w-[210px]
              sm:h-[430px]

              md:w-[240px]
              md:h-[500px]

              lg:w-[260px]
              lg:h-[540px]

              bg-black
              rounded-[42px]

              p-[10px]

              shadow-[0_30px_80px_rgba(0,0,0,0.35)]

              top-1/2
              -translate-y-1/2
            "
          >

            {/* CAMERA / DYNAMIC ISLAND */}
            <div
              className="
                absolute
                top-3
                left-1/2
                -translate-x-1/2

                w-[90px]
                h-[24px]

                bg-black
                rounded-full
                z-20
              "
            />

            {/* SCREEN */}
            <div
              className="
                w-full
                h-full
                rounded-[34px]
                bg-[#050816]
                overflow-hidden
                border
                border-white/5
              "
            >

              {/* CONTENT */}
              <div className="p-4 text-white">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold">
                      {d.title}
                    </p>

                    <p className="text-[9px] text-gray-400 mt-1">
                      {d.subtitle}
                    </p>
                  </div>

                  <button
                    className="
                      bg-blue-600
                      hover:bg-blue-700
                      transition-colors

                      text-[9px]
                      font-medium

                      px-3
                      py-1.5

                      rounded-lg
                    "
                  >
                    {d.newProject}
                  </button>
                </div>

                {/* CARDS */}
                <div className="mt-5 space-y-3">

                  {/* CARD 1 */}
                  <div
                    className="
                      bg-white/[0.03]
                      border
                      border-white/[0.06]
                      rounded-2xl
                      p-4
                    "
                  >
                    <p className="text-[10px] text-gray-400">
                      {d.totalDisbursed}
                    </p>

                    <h3 className="text-lg font-bold mt-2">
                      6,000 XLM
                    </h3>

                    <p className="text-[10px] text-gray-500 mt-1">
                      {d.transactions}
                    </p>
                  </div>

                  {/* CARD 2 */}
                  <div
                    className="
                      bg-white/[0.03]
                      border
                      border-white/[0.06]
                      rounded-2xl
                      p-4
                    "
                  >
                    <p className="text-[10px] text-gray-400">
                      {d.totalExpenses}
                    </p>

                    <h3 className="text-lg font-bold mt-2">
                      5,000 XLM
                    </h3>

                    <p className="text-[10px] text-gray-500 mt-1">
                      {d.records}
                    </p>
                  </div>

                  {/* CARD 3 */}
                  <div
                    className="
                      bg-white/[0.03]
                      border
                      border-white/[0.06]
                      rounded-2xl
                      p-4
                    "
                  >
                    <p className="text-[10px] text-gray-400">
                      {d.activeProjects}
                    </p>

                    <h3 className="text-lg font-bold mt-2">
                      1
                    </h3>

                    <p className="text-[10px] text-gray-500 mt-1">
                      {d.total}
                    </p>
                  </div>

                  {/* CARD 4 */}
                  <div
                    className="
                      bg-white/[0.03]
                      border
                      border-white/[0.06]
                      rounded-2xl
                      p-4
                    "
                  >
                    <p className="text-[10px] text-gray-400">
                      {d.verified}
                    </p>

                    <h3 className="text-lg font-bold mt-2">
                      0
                    </h3>

                    <p className="text-[10px] text-gray-500 mt-1">
                      {d.onchain}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="max-w-xl">

          <h2
            className="
              text-4xl
              md:text-5xl
              font-bold
              leading-tight
              tracking-tight
              text-gray-900
            "
          >
            {t.trustLayer.headingPre}
            <span className="text-blue-600">
              {t.trustLayer.headingHighlight}
            </span>
            {t.trustLayer.headingPost}
          </h2>

          <p
            className="
              mt-6
              text-lg
              leading-relaxed
              text-gray-600
            "
          >
            {t.trustLayer.paragraph1}
          </p>

          <p
            className="
              mt-4
              text-lg
              leading-relaxed
              text-gray-600
            "
          >
            {t.trustLayer.paragraph2}
          </p>

          <a
            href={`${DAPP_BASE}/public/projects`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-2
              mt-8
              px-6
              py-3
              rounded-full
              text-sm
              font-semibold
              text-white
              bg-[#0F52BA]
              hover:bg-[#0B45A0]
              transition-colors
              shadow-md
              shadow-blue-500/20
            "
          >
            {t.trustLayer.ctaProjects}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
