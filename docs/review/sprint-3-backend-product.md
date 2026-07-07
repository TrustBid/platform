# Sprint 3 — Produto Backend (SBT + reads + E2E)

**Data:** 2026-07-05  
**Status:** Concluído

## Remediações aplicadas

| Item | Detalhe |
|------|---------|
| Módulo Badges | `apps/api/src/modules/badges/` |
| `POST /admin/badges/mint` | Admin-only, sync `organization_badges` |
| `POST /admin/badges/:tokenId/revoke` | Admin-only |
| `GET /organizations/:id/badges` | Público, DB + on-chain |
| Reads on-chain | Endpoints em projects/reports controllers |
| Re-alocação | Update de `budgetAmount` re-invoca `allocate` |
| S8 E2E | Habilitado em `contracts-integration.sh` quando `E2E_JWT` setado |

## Decisões

- **Re-alocação:** aprovada — contrato suporta overwrite; API re-invoca em PATCH com novo budget.
- **Badges:** emissão manual via admin; automação KYB/transparência fica backlog pós-sprint 5.

## Verificação

```bash
export E2E_JWT="<jwt>"
npm run dev:api
npm run contracts:api-e2e
```
