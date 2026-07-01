# TrustBid — Contratos Soroban

Capa de trazabilidad on-chain de TrustBid. Tres contratos Soroban (Stellar) que registran de forma inmutable la asignación de fondos, los gastos aprobados y los badges de reputación de las organizaciones.

---

## Contratos

| Contrato | Flujo | Rol en el sistema |
|---|---|---|
| `fund-tracker` | Flujo C | Registra en cadena cuántos fondos se asignan a cada proyecto |
| `expense-anchor` | Flujo E | Ancla el hash SHA-256 del comprobante de cada gasto aprobado |
| `sbt-badge` | Flujo F | Emite Soulbound Tokens (no transferibles) de reputación a organizaciones |

---

## Arquitectura general

```
NestJS API (SorobanService)
       │
       ├─ fund-tracker ──── allocate(project_id, amount_xlm)
       │                    get_allocation(project_id)
       │
       ├─ expense-anchor ── anchor(expense_id, project_id, amount_xlm, receipt_hash)
       │                    get_expense(expense_id)
       │
       └─ sbt-badge ─────── mint_badge(organization, badge_type) → token_id
                            revoke_badge(token_id)
                            get_badges(organization)
```

Los tres contratos comparten el mismo keypair administrador (`STELLAR_SERVER_SECRET`). La API de NestJS actúa como único caller autorizado y envuelve cada operación en `SorobanService`.

**Flujo de negocio:**

1. ONG crea un proyecto y define presupuesto → `fund-tracker.allocate()`
2. ONG registra un gasto con comprobante (PDF en R2) → `expense-anchor.anchor()` con el SHA-256
3. TrustBid verifica la organización o alcanza un hito de transparencia → `sbt-badge.mint_badge()`

Todos los datos on-chain son inmutables y auditables públicamente en Stellar Testnet / Mainnet.

---

## Contratos en detalle

### `fund-tracker`

Registra la asignación de fondos por proyecto. Un registro de auditoría inmutable de cuánto XLM fue asignado a cada proyecto y por quién.

**Storage:**

```
DataKey::Allocation(Symbol) → FundAllocation {
    project_id:   Symbol    // últimos 12 chars del UUID del proyecto
    organization: Address   // wallet de la ONG
    amount_xlm:   i128      // monto en stroops (1 XLM = 10_000_000)
    allocated_at: u64       // timestamp del ledger
}
Admin:            Address
```

**Funciones:**

| Función | Requiere auth | Descripción |
|---|---|---|
| `initialize(admin)` | admin | Inicializa el contrato. Solo puede llamarse una vez. |
| `allocate(caller, project_id, amount_xlm)` | caller | Registra o sobreescribe la asignación de un proyecto. |
| `get_allocation(project_id)` | — | Lectura de la asignación. Retorna `Option<FundAllocation>`. |

**Notas:**
- `allocate` puede llamarse varias veces sobre el mismo `project_id` (sobreescribe). Útil para reasignaciones presupuestarias.
- `project_id` se trunca a 12 caracteres (limitación de `Symbol` en Soroban).

---

### `expense-anchor`

Ancla los gastos aprobados en cadena. Cada registro vincula un gasto con su comprobante mediante el hash SHA-256 del archivo almacenado en Cloudflare R2.

**Storage:**

```
DataKey::Expense(Symbol) → AnchoredExpense {
    expense_id:   Symbol    // últimos 12 chars del UUID del gasto
    project_id:   Symbol    // últimos 12 chars del UUID del proyecto
    submitted_by: Address   // wallet del usuario que registró el gasto
    amount_xlm:   i128      // monto en stroops
    receipt_hash: Bytes     // SHA-256 (32 bytes) del comprobante en R2
    anchored_at:  u64       // timestamp del ledger
}
Admin:            Address
```

**Funciones:**

| Función | Requiere auth | Descripción |
|---|---|---|
| `initialize(admin)` | admin | Inicializa el contrato. |
| `anchor(caller, expense_id, project_id, amount_xlm, receipt_hash)` | caller | Registra el gasto on-chain. |
| `get_expense(expense_id)` | — | Lectura del gasto. Retorna `Option<AnchoredExpense>`. |

**Eventos emitidos:**

```
topic:  ("expense_anchored",)
data:   AnchoredExpense { ... }
```

**Notas:**
- El `receipt_hash` es el SHA-256 del archivo original en R2. Permite a cualquier auditor verificar que el comprobante no fue alterado comparando el hash on-chain con el archivo descargado.
- Al igual que `fund-tracker`, `anchor` sobreescribe si se llama con el mismo `expense_id`.

---

### `sbt-badge`

Soulbound Tokens (SBT) de reputación organizacional. No son transferibles por diseño: no existe función `transfer`. Los badges revocados permanecen en el ledger con `status = Revoked` (append-only).

**Storage:**

```
DataKey::Admin               → Address
DataKey::NextTokenId         → u64              // contador global, empieza en 1
DataKey::BadgeById(u64)      → Badge {
    token_id:     u64
    badge_type:   Symbol     // ver tipos válidos abajo
    organization: Address    // wallet de la ONG
    status:       BadgeStatus (Active | Revoked)
    issued_at:    u64        // timestamp del ledger al momento de mint
    revoked_at:   u64        // 0 si no ha sido revocado
}
DataKey::OrgBadges(Address)  → Vec<u64>         // índice org → token_ids
```

**Tipos de badge:**

| Badge | Significado |
|---|---|
| `kyb_verified` | La organización completó el proceso KYB (Know Your Business) |
| `transparency_bronze` | Primer hito de transparencia alcanzado |
| `transparency_silver` | Hito intermedio de transparencia |
| `transparency_gold` | Máximo nivel de transparencia verificado |

> Los tipos válidos están compilados en el contrato (`validate_badge_type`). Agregar un nuevo tipo requiere redesplegar el contrato y actualizar la variable de entorno `SBT_BADGE_CONTRACT_ID`.

**Funciones:**

| Función | Requiere auth | Descripción |
|---|---|---|
| `initialize(admin)` | admin | Inicializa. Panic si ya fue inicializado. |
| `mint_badge(organization, badge_type) → u64` | admin | Emite un badge. Retorna el `token_id`. |
| `revoke_badge(token_id)` | admin | Revoca un badge activo. Panic si no existe o ya está revocado. |
| `get_badge(token_id) → Option<Badge>` | — | Badge por ID. |
| `get_badges(organization) → Vec<Badge>` | — | Todos los badges (activos + revocados) de una org. |
| `get_active_badges(organization) → Vec<Badge>` | — | Solo los badges activos de una org. |

**Eventos emitidos:**

```
mint:   topic: ("badge_minted", badge_type)   data: (token_id, organization)
revoke: topic: ("badge_revoked",)             data: (token_id, organization)
```

---

## Estructura del repositorio

```
contracts/
├── contracts/
│   ├── fund-tracker/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs        # Contrato + 5 tests
│   ├── expense-anchor/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs        # Contrato + 7 tests
│   └── sbt-badge/
│       ├── Cargo.toml
│       └── src/lib.rs        # Contrato + 15 tests
└── Cargo.toml                # Workspace Rust
```

---

## Requisitos

- **Rust** (vía rustup, no Homebrew): [https://rustup.rs](https://rustup.rs)
- **Target WASM** para Soroban SDK 22: `wasm32v1-none`
- **Stellar CLI**: `cargo install stellar-cli --version 22.0.1`

```bash
# Agregar el target correcto
rustup target add wasm32v1-none

# Verificar que cargo de rustup tiene prioridad (NO el de Homebrew)
which cargo   # debe apuntar a ~/.cargo/bin/cargo
```

---

## Comandos

```bash
# Tests (todos los contratos)
cargo test --workspace

# Tests de un contrato específico
cargo test -p fund-tracker
cargo test -p expense-anchor
cargo test -p sbt-badge

# Build WASM (usar stellar CLI, no cargo build directo)
PATH="$HOME/.cargo/bin:$PATH" stellar contract build

# El resultado queda en:
# target/wasm32v1-none/release/fund_tracker.wasm
# target/wasm32v1-none/release/expense_anchor.wasm
# target/wasm32v1-none/release/sbt_badge.wasm
```

### Deploy en testnet

```bash
# fund-tracker
stellar contract deploy \
  --wasm target/wasm32v1-none/release/fund_tracker.wasm \
  --network testnet \
  --source <ACCOUNT>

# expense-anchor
stellar contract deploy \
  --wasm target/wasm32v1-none/release/expense_anchor.wasm \
  --network testnet \
  --source <ACCOUNT>

# sbt-badge
stellar contract deploy \
  --wasm target/wasm32v1-none/release/sbt_badge.wasm \
  --network testnet \
  --source <ACCOUNT>

# Inicializar (requerido antes de cualquier operación)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <ACCOUNT> \
  -- initialize --admin <ADMIN_ADDRESS>
```

---

## Variables de entorno (Railway / NestJS)

Los IDs de los contratos desplegados se pasan al backend como variables de entorno. No están hardcodeados en el código TypeScript.

| Variable | Contrato |
|---|---|
| `FUND_TRACKER_CONTRACT_ID` | fund-tracker |
| `EXPENSE_ANCHOR_CONTRACT_ID` | expense-anchor |
| `SBT_BADGE_CONTRACT_ID` | sbt-badge |
| `STELLAR_SERVER_SECRET` | Keypair administrador compartido por los tres contratos |
| `STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` (testnet) |

---

## Cobertura de tests

| Contrato | Tests | Casos cubiertos |
|---|---|---|
| `fund-tracker` | 5 | allocate + get, inexistente, reasignación, proyectos independientes, timestamp |
| `expense-anchor` | 7 | anchor + get, inexistente, timestamp, gastos independientes, sobreescritura, evento, múltiples callers |
| `sbt-badge` | 15 | IDs secuenciales, evento mint, datos correctos, inexistente, get_badges, org vacía, activos vs revocados, revoke timestamp, evento revoke, doble revoke panic, inexistente panic, tipos válidos, tipo inválido panic, aislamiento multi-org, doble initialize panic |
