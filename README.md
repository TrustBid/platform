# TrustBid Contracts

Smart contracts Soroban (Stellar) de TrustBid.

## Contratos

| Contrato | Descripción |
|---|---|
| `fund-tracker` | Registra asignaciones de fondos por proyecto en cadena |
| `expense-anchor` | Ancla gastos aprobados con hash del comprobante (R2) |

## Requisitos

- [Rust](https://rustup.rs/) (stable)
- Target `wasm32-unknown-unknown`: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli): `cargo install stellar-cli`

## Comandos

```bash
# Tests
cargo test --workspace

# Build WASM
cargo build --workspace --target wasm32-unknown-unknown --release

# Deploy en testnet (requiere Stellar CLI)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fund_tracker.wasm \
  --network testnet \
  --source <ACCOUNT>
```

## Estructura

```
contracts/
├── contracts/
│   ├── fund-tracker/     # Asignación de fondos por proyecto
│   └── expense-anchor/   # Anclaje de gastos con hash de comprobante
└── Cargo.toml            # Workspace Rust
```
