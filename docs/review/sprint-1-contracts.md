# Sprint 1 — Revisão Contratos + Tooling

**Data:** 2026-07-05  
**Status:** Concluído

## Escopo revisado

- 3 contratos Soroban (fund-tracker, expense-anchor, sbt-badge) — SDK 23.0.0
- Caatinga config, artifacts e bindings freshness
- CI workflows (raiz + legado `contracts/.github/`)
- Pipeline de regressão S9-05

## Findings

| ID | Severidade | Finding | Ação |
|----|------------|---------|------|
| S1-01 | Média | Stellar CLI divergente: CI raiz 27.0.0, legado 22.0.1, AGENTS.md pin 23.0.0 | **Corrigido** — pin 23.0.0 em todos os workflows |
| S1-02 | Baixa | S9-04 (bindings stale) só documentado, não automatizado | **Corrigido** — gate em `scripts/contracts-regression.sh` |
| S1-03 | Info | Sem entrypoint `upgrade()` nos contratos | Documentado em `contracts/README.md` |
| S1-04 | Info | Double-init inconsistente entre contratos | Documentado — policy por contrato |
| S1-05 | Info | Amounts negativos e hash curto aceitos on-chain | Mantido — validação na API (Sprint 2) |
| S1-06 | Info | Bindings fresh em testnet (2026-07-04 deploy) | OK — markers alinhados com artifacts |

## Decisões tomadas

1. **Stellar CLI 23.0.0** como pin único (alinhado ao Soroban SDK 23.0.0).
2. **S9-04** falha regressão se `caatinga status` reportar `stale` ou `missing`.
3. **Validação on-chain de amounts** adiada — requer redeploy; API valida antes de invoke.

## Verificação

```bash
npm run contracts:test
npm run contracts:build
npx caatinga doctor --network testnet
npx caatinga status --network testnet
```

## Próximo sprint

Backend SorobanService — expor tx hashes, logs estruturados, retry anchor, testes unitários.
