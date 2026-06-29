# TrustBid Platform

Monorepo principal de TrustBid — capa de transparencia y trazabilidad de fondos para ONGs sobre Stellar.

## Estructura

```
platform/
├── apps/
│   ├── dapp/        # DApp principal — Next.js 15 + TypeScript
│   ├── api/         # API REST — NestJS 11 + PostgreSQL (Neon)
│   ├── landing/     # Sitio de marketing — React + Vite
│   └── docs-site/   # Documentación pública — Next.js static
├── packages/
│   ├── types/       # Tipos TypeScript compartidos (@trustbid/types)
│   ├── ui/          # Componentes React compartidos (@trustbid/ui)
│   └── stellar-sdk/ # Wrappers Stellar/Soroban (@trustbid/stellar-sdk)
├── turbo.json
└── package.json
```

## Comandos

```bash
npm install          # instala todas las dependencias del workspace

npm run dev          # levanta dapp + api en paralelo
npm run dev:dapp     # solo la DApp  → http://localhost:3000
npm run dev:api      # solo la API   → http://localhost:3001

npm run build        # build de todos los apps
npm run lint         # lint de todos los packages
npm run type-check   # type-check de todos los packages
```

## Repositorios relacionados

| Repo | Descripción |
|---|---|
| [TrustBid/docs](https://github.com/TrustBid/docs) | Diagramas UML/C4 y documentación técnica |
| [TrustBid/contracts](https://github.com/TrustBid/contracts) | Smart contracts Soroban (Rust) |

## Flujo de trabajo

- Ramas: `main` (producción) · `develop` (integración) · `feat/*` · `fix/*` · `chore/*`
- Toda contribución va por PR — nunca push directo a `main`
- Cada PR requiere al menos 1 aprobación y que pasen los checks de CI
