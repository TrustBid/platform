// src/components/Footer.jsx
import logoFooter from '../assets/logoFooter.webp';
import { openAccessModal } from '../lib/accessModal';
import { useI18n } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useI18n();
  const navigationLinks = t.footer.navigationLinks;
  const resourceLinks = t.footer.resourceLinks;

  const socialLinks = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/trustbidapp/' },
    { label: 'X', href: 'https://x.com/TrustBidApp' },
    { label: 'Instagram', href: 'https://www.instagram.com/trustbid_/' },
  ];

  return (
    <footer id="footer" className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Contenido principal - Flex con logo izquierda y links derecha en la misma linea */}
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:items-start border-b border-white/10 pb-8">
          {/* Logo y descripción - lado izquierdo */}
          <div>
            <img
              src={logoFooter}
              alt="TrustBid Logo"
              className="h-10 mb-4"
            />
            <p className="text-sm text-white">{t.footer.tagline}</p>
          </div>

          {/* Links derechos - Grid compacto alineado arriba */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-sm text-gray-400">
            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-white mb-4">{t.footer.navigation}</h3>
              <ul className="space-y-2">
                {navigationLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={link.href === '#access' ? (e) => { e.preventDefault(); openAccessModal({ source: 'footer' }); } : undefined}
                      className="hover:text-white transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-white mb-4">{t.footer.resources}</h3>
              <ul className="space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href} 
                      className="hover:text-white transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-semibold text-white mb-4">{t.footer.social}</h3>
              <ul className="space-y-2">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-600">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}