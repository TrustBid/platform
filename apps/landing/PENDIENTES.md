# Pendientes — Landing TrustBid

Cosas que dejamos a medias a propósito en la fase 1 (contacto orgánico/personal).
Revisar antes de la siguiente fase.

## 🔧 Formulario de acceso (ya funcional)
El modal "Solicitar acceso" envía vía Formspree. El id (`mdarorkz`) está
**hardcodeado como valor por defecto** en `src/components/AccessModal.jsx`
(no es secreto: viaja en la petición del navegador igual). Funciona sin
configurar nada en Cloudflare.

Para cambiar de form sin tocar código, define `VITE_FORMSPREE_ID=<otro-id>`
(local en `.env.local`, producción en Cloudflare Pages → Environment variables).
Ver `.env.example`.

## 🙈 Enlaces ocultados (no tenían destino real)
Se quitaron de la landing porque aún no existe el contenido. Reactivar cuando exista:

- **Footer → "Problem / Problema"** — no hay sección de problema dedicada.
- **Footer → "Docs"** — no hay documentación pública todavía.
- **FAQ → "See more / Ver más"** — no hay página de FAQ completa.
  (Comentado en `src/components/FAQ.jsx`; el string `faq.seeMore` sigue en
  `translations.js` por si se reactiva.)

## ✅ Ya resueltos en esta ronda
- Todos los CTA (Hero, 3 de pricing, footer "Unirse a la lista") abren el modal de acceso.
- Footer "FAQ" ahora ancla a la sección `#faq` (antes saltaba al inicio).
- Pricing: Basic $9.99 (free trial), Plus $14.99, Enterprise (Contact Sales).
