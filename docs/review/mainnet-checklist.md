# Checklist Mainnet — TrustBid Soroban

Documento de preparação (não executa deploy).

## Pré-requisitos

- [ ] Conta server (`STELLAR_SERVER_SECRET`) funded em mainnet
- [ ] Stellar CLI 23.0.0 instalado localmente e no CI
- [ ] Rust target `wasm32v1-none` disponível

## Contratos

- [ ] `npm run contracts:build` — WASM release
- [ ] Deploy mainnet via Caatinga: `caatinga deploy --network mainnet --source <alias>`
- [ ] `initialize(admin)` chamado uma vez por contrato (sbt-badge panic em double-init)
- [ ] `npm run contracts:generate -- --network mainnet`
- [ ] `caatinga status --network mainnet` → 3 contratos `fresh`

## Backend (Railway)

- [ ] `STELLAR_NETWORK=public` (Horizon/auth) — SorobanService aceita `public` ou `mainnet`
- [ ] `STELLAR_RPC_URL` apontando para RPC Soroban mainnet
- [ ] `FUND_TRACKER_CONTRACT_ID`, `EXPENSE_ANCHOR_CONTRACT_ID`, `SBT_BADGE_CONTRACT_ID` de mainnet
- [ ] `STELLAR_HORIZON_URL=https://horizon.stellar.org`
- [ ] Migrações DB aplicadas: `sprint7-anchor-txhash.sql`, `sprint-review-blockchain-status.sql`, `sprint4-sbt-zk.sql`

## Frontend

- [ ] `NEXT_PUBLIC_STELLAR_NETWORK=public`
- [ ] `NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org`
- [ ] Smoke manual: criar projeto → allocation tx visível; report → anchor tx visível

## Validação

```bash
npm run release:gate
RUN_INTEGRATION=1 npm run release:gate   # com secrets testnet/mainnet
```

## Riscos conhecidos

- Contratos sem `upgrade()` — redeploy cria novos contract IDs
- Auth model: server signer on-chain ≠ org wallet off-chain
- Asset mismatch: contratos em stroops XLM; UI pode exibir USDC em alguns fluxos
