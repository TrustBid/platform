# Sprint 4 — Frontend: visibilidade on-chain

**Data:** 2026-07-05  
**Status:** Concluído

## Remediações aplicadas

| Item | Arquivo |
|------|---------|
| `allocationTxHash` / `blockchainStatus` nos hooks | `useProjects.ts`, `useReports.ts` |
| Badge blockchain + verify on-chain | `projects/[id]/page.tsx` |
| Coluna blockchain em reports | `dashboard/reports/page.tsx` |
| `OrgBadges` em settings | `settings/page.tsx`, `OrgBadges.tsx` |
| Rede unificada (explorer + DonateFlow) | `stellar-explorer.ts`, `DonateFlow.tsx`, `RecentActivity.tsx` |
| Tipos compartilhados badges | `packages/types/src/badge.ts` |
| Componentes reutilizáveis | `BlockchainAnchorBadge.tsx` |

## Estratégia client Soroban

**Fase 1 (implementada):** reads via REST (`/on-chain`) + links Stellar Expert.  
**Fase 2 (backlog):** `@caatinga/client` para reads diretos no browser.

## Verificação

```bash
npm run dev:dapp
# Criar projeto com blockchain → ver allocation status
# Criar report → ver anchor status (polling manual refresh)
```
