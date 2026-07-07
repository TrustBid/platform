# Sprint 2 — Revisão Backend Soroban

**Data:** 2026-07-05  
**Status:** Concluído

## Remediações aplicadas

| Item | Arquivo(s) |
|------|------------|
| `allocationTxHash` + `blockchainStatus` em list/get projetos | `projects.service.ts` |
| `blockchainStatus` em reports | `reports.service.ts` |
| Retry anchor (2 tentativas) | `soroban.service.ts` → `anchorExpenseWithRetry` |
| Logs estruturados com IDs | `soroban.service.ts` |
| Mainnet unificado (`public` \| `mainnet`) | `common/utils/stellar-network.ts`, `soroban.service.ts` |
| Endpoints on-chain read | `GET /my/projects/:id/on-chain`, `GET /my/reports/:id/on-chain` |
| Re-alocação em update de budget | `projects.service.ts` |
| Migração `blockchain_status` | `db/sprint-review-blockchain-status.sql` |
| Remoção `audit_passed` do enum | `db/sprint4-sbt-zk.sql` |
| Testes unitários expandidos (≥10) | `soroban.service.spec.ts` |

## Verificação

```bash
npm run test --workspace=@trustbid/api -- --testPathPatterns=soroban.service.spec
npm run contracts:integration
```
