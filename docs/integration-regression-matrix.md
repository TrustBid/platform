# Matriz de Regressão — Caatinga + Contracts + Platform

| ID | Cenário | Comando / validação | Sprint |
|----|---------|---------------------|--------|
| S9-01 | Projeto alocado → report ancorado | `testCrossContract` em soroban-integration.ts | 9 |
| S9-02 | Re-deploy parcial | `REGRESSION_DEPLOY=1 npm run contracts:regression` | 9 |
| S9-03 | WASM hash drift | `npx caatinga status` vs caatinga.artifacts.json vs `.caatinga-bindings.json` | 9 |
| S9-04 | Bindings stale | **Automatizado** em `scripts/contracts-regression.sh` (falha se `stale`/`missing`) | 9 |
| S9-05 | Full pipeline | `npm run contracts:regression` | 9 |
| S9-06 | CI espelho | `gh workflow run soroban-integration.yml` | 10 |
| S10-01 | Badges admin mint → DB sync | Manual ou script: POST `/admin/badges/mint` | Review |
| S10-02 | On-chain reads HTTP | GET `/my/projects/:id/on-chain`, `/my/reports/:id/on-chain` | Review |
| S10-03 | UI blockchain status | Dapp exibe `allocationTxHash` / `anchorTxHash` | Review |
| S10-04 | Release gate offline | `npm run release:gate` | Review |
| S10-05 | Mainnet dry-run | Seguir `docs/review/mainnet-checklist.md` | Review |

## Pipeline completo (S9-05)

```bash
npm run contracts:regression
# ou com redeploy:
REGRESSION_DEPLOY=1 npm run contracts:regression
```

## Verificação manual S9-03

```bash
npx caatinga status --network testnet
# wasmHash prefix must match caatinga.artifacts.json and generated bindings metadata
```
