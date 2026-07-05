# TrustBid — AGENTS.md

## Repository structure

Monorepo único em `platform/` — Node (Turborepo) + Rust (Soroban contracts).

```
platform/
├── apps/           # dapp, api, landing, docs-site
├── packages/       # types, ui, stellar-sdk, soroban-bindings
├── contracts/      # Soroban workspace (fund-tracker, expense-anchor, sbt-badge)
├── caatinga.config.ts
└── package.json
```

Contract IDs chegam à API via env vars (`FUND_TRACKER_CONTRACT_ID`, etc.) ou `caatinga.artifacts.json` em dev.

**Referência Caatinga (sprints 13–16):** https://raw.githubusercontent.com/Dione-b/caatinga/main/llms-full.txt

## Contracts (`platform/contracts/`)

Soroban SDK **23.0.0**, Stellar CLI **≥23.0.0** (CI pin 23.0.0).

```bash
# Desde platform/
npm run contracts:test
npm run contracts:build
npm run contracts:integration   # testnet: doctor + read smoke + SorobanService E2E

# Ou direto:
cargo test --manifest-path contracts/Cargo.toml --workspace
cd contracts && stellar contract build
```

**Must-know:**
- WASM target: `wasm32v1-none`
- Após deploy, `initialize` deve ser chamado uma vez por contrato
- Env vars API: `FUND_TRACKER_CONTRACT_ID`, `EXPENSE_ANCHOR_CONTRACT_ID`, `SBT_BADGE_CONTRACT_ID`, `STELLAR_SERVER_SECRET`, `STELLAR_RPC_URL`
- Profile `release-with-logs` disponível para debug testnet

**3 contracts:**
| Contract | Purpose |
|---|---|
| `fund-tracker` | Records fund allocation per project |
| `expense-anchor` | Anchors SHA-256 hash of approved expense receipts |
| `sbt-badge` | Non-transferable reputation SBTs for orgs |

## Platform (`platform/`)

Monorepo managed by **Turborepo + npm workspaces**. Package manager: `npm@11.12.1`.

### Commands (run from `platform/`)

```bash
npm install
npm run dev              # dapp (3000) + api (3001)
npm run dev:dapp
npm run dev:api
npm run build
npm run lint
npm run type-check

# Contracts
npm run contracts:test       # cargo test --workspace
npm run contracts:build      # stellar contract build (via buildRoot)
npm run contracts:deploy     # caatinga deploy (full graph)
npm run contracts:generate   # caatinga generate bindings
npm run contracts:smoke      # caatinga smoke (config-based read checks)
npm run contracts:doctor     # caatinga doctor --strict
npm run contracts:status     # caatinga status (binding freshness table)
npm run contracts:sync-env   # caatinga sync-env (write .env.local from artifacts)

# Integration
npm run contracts:integration  # testnet E2E (doctor + smoke + SorobanService)
npm run contracts:regression   # full offline + testnet pipeline (S9-05)
npm run release:gate           # offline release gate (test + build + type-check + unit)
npm run contracts:api-e2e      # Sprint 8 HTTP E2E (requires E2E_JWT + running API)
```

### Apps

| App | Stack | Port |
|---|---|---|
| `apps/dapp` | Next.js, React, Tailwind v4 | 3000 |
| `apps/api` | NestJS 11, PostgreSQL, Redis, BullMQ | 3001 |
| `apps/landing` | React, Vite | 5173 |
| `apps/docs-site` | Next.js static | 3000 |

### Packages

| Package | Role |
|---|---|
| `@trustbid/types` | Shared TypeScript types |
| `@trustbid/ui` | Shared React components |
| `@trustbid/stellar-sdk` | Stellar classic (Horizon) wrappers |
| `@trustbid/soroban-bindings` | Generated Soroban contract clients |

### API Soroban

- `apps/api/src/modules/soroban/soroban.service.ts` — único ponto de invoke server-side
- Assina com `STELLAR_SERVER_SECRET` via `@stellar/stellar-sdk` + bindings tipados

### DApp quirks

- `NEXT_PUBLIC_PRIVY_APP_ID` required in `.env.local`
- Middleware protege `/dashboard/*` via cookie `tb_jwt`
- **Client-side Soroban (atual):** reads on-chain via REST (`GET /my/projects/:id/on-chain`, `/my/reports/:id/on-chain`); tx hashes exibidos no dashboard. Wallet via `@creit.tech/stellar-wallets-kit` + SEP-10.
- **Fase 2 (backlog):** `@caatinga/client` para reads/invokes diretos no browser — ver `docs/review/sprint-4-frontend.md`

**@caatinga/client usage (browser — roadmap):**

```ts
import { createCaatingaClient } from "@caatinga/client";
import { WalletProvider, useWallet } from "@caatinga/client/react";

// Read-only (no wallet needed)
const value = await client.contract("fund-tracker").read<number>("get_allocation", { project_id: "..." });

// State-changing (requires wallet)
const result = await client.contract("sbt-badge").invoke("mint_badge", { ... });
```

Wallet adapters: `@caatinga/client/freighter` or `@caatinga/client/stellar-wallets-kit`. Single-invoker only until v1.0.

### API quirks

- Railway deploy via `nixpacks.toml` (só `apps/api`)
- `.railwayignore` exclui `contracts/target/`
- Testes: `*.spec.ts` via Jest

### Soroban integration runbook

**Smoke gate (release):**

```bash
npm run contracts:smoke      # quick read-only check
npm run contracts:integration  # full E2E (doctor + smoke + SorobanService)
```

**Diagnostics:**

| Command | Purpose |
|---|---|
| `npm run contracts:doctor` | Full env check (Node, Rust, Stellar CLI, artifacts, bindings) |
| `npm run contracts:status` | Contract table with binding freshness per network |
| `npm run contracts:smoke` | Read-only contract reachability checks |

**Contract upgrade (Caatinga 3.7.0):**

| Strategy | Command | On-chain effect | `contractId` |
|---|---|---|---|
| **In-place** | `caatinga upgrade <contract> --network testnet --source trustbid` | Replaces WASM on existing instance | Preserved |
| **Redeploy** | `npm run contracts:deploy` with `--upgrade` flag | Deploys new instance | New ID |

In-place upgrade requires the contract to expose an `upgrade(new_wasm_hash)` admin entrypoint. Use `--if-changed` to skip when WASM hasn't changed.

**Full regression (S9-05):**

```bash
npm run contracts:regression
# inclui redeploy testnet:
REGRESSION_DEPLOY=1 npm run contracts:regression
```

**API HTTP E2E (Sprint 8):**

```bash
npm run dev:api   # terminal 1
export E2E_JWT="<jwt válido>"
npm run contracts:api-e2e
```

**Troubleshooting:**

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `Missing signer` | Sem `STELLAR_SERVER_SECRET` nem identidade CLI | `stellar keys generate trustbid` + fund testnet, ou set secret em `apps/api/.env.local` |
| `doctor` falha RPC | Rede / firewall | Verificar `STELLAR_RPC_URL` e `curl` no RPC Soroban |
| Integração passa, API não ancora | DB sem coluna `anchor_tx_hash` | Rodar `apps/api/db/sprint7-anchor-txhash.sql` |
| `get_badges` smoke falha | Org passada como alias em vez de G... | Corrigido em `scripts/contracts-integration.sh` |
| Bindings stale após deploy | Esqueceu `contracts:generate` | `npm run contracts:generate` |
| WASM hash drift | Deploy local ≠ artifacts | `npm run contracts:deploy` ou alinhar artifacts |

**Binding freshness:**

| State | Meaning | Fix |
|---|---|---|
| `fresh` | Bindings match deployed `contractId` + `wasmHash` | — |
| `stale` | Contract redeployed since last generate | `npm run contracts:generate` |
| `missing` | No bindings on disk | `npm run contracts:generate` |
| `unknown` | Bindings exist but predate freshness tracking | Regenerate once |

Tracked via `.caatinga-bindings.json` marker next to each generated binding package.

**Error codes (common):**

| Code | Trigger | Fix |
|---|---|---|
| `CAATINGA_STELLAR_CLI_NOT_FOUND` | `stellar` not in PATH | `npm run contracts:setup` |
| `CAATINGA_BUILD_FAILED` | Cargo build error | Check Rust toolchain + `wasm32v1-none` target |
| `CAATINGA_DEPLOY_FAILED` | Stellar CLI deploy error | Check network, source identity, funded account |
| `CAATINGA_BINDINGS_FAILED` | Binding generation error | Check contracts compile + `stellar-sdk` version |
| `CAATINGA_INVOKE_FAILED` | Contract invoke error | Check contract state + args |
| `CAATINGA_CONTRACT_NOT_FOUND` | Unknown contract name | Check `caatinga.config.ts` contracts section |
| `CAATINGA_SOURCE_IS_SECRET_KEY` | `S...` as `--source` | Use CLI identity alias (`trustbid`), never raw keys |
| `CAATINGA_ADDRESS_ALIAS_UNRESOLVED` | Arg ≥3 chars treated as alias | Use `<3` char string or `${source.address}` |

Full catalog: https://raw.githubusercontent.com/Dione-b/caatinga/main/llms-full.txt

**CI integração testnet:** `.github/workflows/soroban-integration.yml` (manual `workflow_dispatch`; secrets `STELLAR_SERVER_SECRET`, `CAATINGA_CI_*`).

**Logs de teste:** `docs/test-runs/` e matriz em `docs/integration-regression-matrix.md`.

## Next.js 16 caveat

`apps/dapp/AGENTS.md` — breaking changes vs training data; consultar `node_modules/next/dist/docs/` se necessário.
