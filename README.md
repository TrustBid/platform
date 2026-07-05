# TrustBid Platform

Monorepo for TrustBid — a transparency and traceability platform for NGOs on the Stellar blockchain.

## Structure

```
platform/
├── apps/
│   ├── dapp/        # Main DApp — Next.js + TypeScript
│   ├── api/         # REST API — NestJS + PostgreSQL (Neon)
│   ├── landing/     # Marketing site — React + Vite
│   └── docs-site/   # Public docs — Next.js static
├── packages/
│   ├── types/       # Shared TypeScript types (@trustbid/types)
│   ├── ui/          # Shared React components (@trustbid/ui)
│   ├── stellar-sdk/ # Stellar classic wrappers (@trustbid/stellar-sdk)
│   └── soroban-bindings/ # Generated Soroban contract clients (@trustbid/soroban-bindings)
├── contracts/       # Soroban smart contracts (Rust workspace)
│   └── contracts/   # fund-tracker, expense-anchor, sbt-badge
├── caatinga.config.ts    # Deploy orchestration (Caatinga 3.7.0)
├── caatinga.artifacts.json
├── turbo.json
└── package.json
```

## Quick Start

```bash
npm install          # install all workspace dependencies
npm run dev          # start dapp (3000) + api (3001)
```

## Commands

```bash
npm run build              # build all apps
npm run lint               # lint all packages
npm run type-check         # type-check all packages

# Soroban contracts (requires Rust + Stellar CLI)
npm run contracts:test     # cargo test --workspace
npm run contracts:build    # stellar contract build
npm run contracts:deploy   # caatinga deploy (testnet)
npm run contracts:generate # generate TypeScript bindings
npm run contracts:smoke    # read-only smoke checks
npm run contracts:doctor   # full env diagnostics
npm run contracts:status   # binding freshness table
npm run contracts:integration  # full E2E (doctor + smoke + SorobanService)
npm run contracts:regression   # full offline + testnet pipeline
```

## Soroban Contracts

Three contracts in `contracts/` (Rust workspace). After testnet deploy, contract IDs are passed to the API via env vars or `caatinga.artifacts.json`.

| Contract | Purpose |
|---|---|
| `fund-tracker` | Records fund allocation per project |
| `expense-anchor` | Anchors SHA-256 hash of approved expense receipts |
| `sbt-badge` | Non-transferable reputation SBTs for organizations |

See `contracts/README.md` and `contracts/AUDIT.md` for on-chain details.

## Related Repos

| Repo | Description |
|---|---|
| [TrustBid/docs](https://github.com/TrustBid/docs) | UML/C4 diagrams and technical documentation |

> **Note:** `TrustBid/contracts` was consolidated into this monorepo (`platform/contracts/`). The old repo is archived.

## Workflow

- Branches: `main` (production) · `develop` (integration) · `feat/*` · `fix/*` · `chore/*`
- All contributions go through PR — never push directly to `main`
- Each PR requires at least 1 approval and passing CI checks

For detailed agent instructions, see [AGENTS.md](./AGENTS.md).
