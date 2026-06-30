# TrustBid

> Every fund leaves a trace.

Marketing landing page for **TrustBid**, a transparency and traceability layer for
social funds. TrustBid helps organizations and NGOs record how funds are used and
generate verifiable, donor-ready reports — with the audit trail anchored to the
[Stellar](https://stellar.org) network behind the scenes (no wallets or crypto
knowledge required from the user).

## Tech stack

- [React 19](https://react.dev)
- [Vite 8](https://vite.dev) (build tool + dev server)
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- ESLint

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR       |
| `npm run build`   | Build for production into `dist/`        |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint                               |

## Project structure

```
src/
├── App.jsx          Assembles the page sections in order
├── main.jsx         App entry point
├── index.css        Tailwind import + custom animations
├── assets/          Images (optimized WebP)
└── components/
    ├── Hero.jsx         Navbar + hero headline
    ├── Features.jsx     "Your reporting problem, solved"
    ├── TrustLayer.jsx   Phone mockup with dashboard preview
    ├── HowItWorks.jsx   Scroll-driven 3-step wheel animation
    ├── FAQ.jsx          Accordion
    ├── Pricing.jsx      Pricing tiers
    └── Footer.jsx       Links + socials
```

## Notes

- Images are served as **WebP** for performance. When adding new assets, keep
  filename casing exact in imports — production builds run on case-sensitive
  filesystems (Linux/Vercel/Netlify), unlike macOS.
</content>
</invoke>
