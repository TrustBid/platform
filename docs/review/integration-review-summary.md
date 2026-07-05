# Integration Review Summary

**Data:** 2026-07-05  
**Escopo:** Contratos Soroban → API NestJS → Dapp Next.js (5 sprints)

## Resultado geral

A cadeia contratos → backend → frontend foi revisada e remediada. O backend agora expõe estado blockchain completo; o frontend exibe tx hashes e badges; CI/tooling está alinhado.

## Sprints concluídos

| Sprint | Doc | Status |
|--------|-----|--------|
| 1 — Contratos + Tooling | [sprint-1-contracts.md](./sprint-1-contracts.md) | OK |
| 2 — Backend core | [sprint-2-backend.md](./sprint-2-backend.md) | OK |
| 3 — Backend produto | [sprint-3-backend-product.md](./sprint-3-backend-product.md) | OK |
| 4 — Frontend | [sprint-4-frontend.md](./sprint-4-frontend.md) | OK |
| 5 — E2E/CI | este doc + [mainnet-checklist.md](./mainnet-checklist.md) | OK |

## Matriz de regressão (S9 + S10)

Ver [integration-regression-matrix.md](../integration-regression-matrix.md).

## Backlog pós-revisão (priorizado)

| Prioridade | Item | Sprint sugerido |
|------------|------|-----------------|
| Alta | Automação KYB → mint badge | 6 |
| Alta | Playwright smoke dapp (projeto + report + hashes) | 6 |
| Média | `@caatinga/client` reads no browser | 6+ |
| Média | Entrypoint `upgrade()` nos contratos | redeploy |
| Média | Validação on-chain amount ≥ 0 | redeploy |
| Baixa | ZK proofs (`zk_proofs` schema) | futuro |
| Baixa | Eventos em fund-tracker | redeploy |

## Comandos de release

```bash
npm run release:gate                    # offline gate
npm run contracts:regression            # pipeline S9-05 completo
RUN_INTEGRATION=1 npm run release:gate  # + testnet
export E2E_JWT="..." && npm run release:gate  # + HTTP E2E
```

## Decisões registradas

1. **Re-alocação:** PATCH de budget re-invoca `allocate` quando `blockchain_enabled=true`.
2. **Client Soroban browser:** fase 1 REST reads; Caatinga client fase 2.
3. **Stellar CLI pin:** 23.0.0 em todos os workflows.
4. **Mainnet env:** usar `STELLAR_NETWORK=public` para Horizon; Soroban aceita `public` ou `mainnet`.
