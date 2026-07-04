# TrustBid — Auditoría de Contratos Soroban

**Fecha:** 2026-06-30  
**Alcance:** `fund-tracker`, `expense-anchor`, `sbt-badge`  
**Modo:** auditoría documental (sin cambios de comportamiento on-chain)

---

## Resumen ejecutivo

Los tres contratos cumplen su función básica de registro inmutable on-chain. `sbt-badge` es el más maduro (auth admin, validación de inputs, eventos, `initialize` idempotente). `fund-tracker` y `expense-anchor` son más simples y presentan **gaps documentales** entre lo que el README afirmaba y lo que el código hace.

**Modelo de confianza actual:**

| Capa | Fuente de verdad |
|---|---|
| **On-chain** | Payload inmutable attestado por el signer (`project_id`, montos, hashes, badges) |
| **Off-chain** | Atribución org/usuario (Postgres + NestJS `SorobanService`) |

Con un único `STELLAR_SERVER_SECRET`, los campos `organization` y `submitted_by` en cadena registran la **wallet del servidor**, no la ONG ni el usuario final. La auditoría de "quién hizo qué" depende del backend.

---

## Tabla de hallazgos

| ID | Severidad | Contrato(s) | Descripción | Estado | Backlog |
|---|---|---|---|---|---|
| A-01 | Alta | `fund-tracker`, `expense-anchor` | `caller.require_auth()` hace que el signer sea `organization`/`submitted_by`; README implicaba wallet de ONG/usuario | Documentado | Auth admin-proxy |
| A-02 | Alta | `fund-tracker`, `expense-anchor` | `initialize` puede llamarse múltiples veces (sobrescribe `Admin`); README decía one-shot | Documentado | Panic `already_initialized` |
| A-03 | Alta | `fund-tracker`, `expense-anchor` | `DataKey::Admin` se escribe pero no se lee en mutaciones | Documentado | `require_admin` en writes |
| M-04 | Media | `fund-tracker` | No emite eventos en `allocate` (inconsistente con otros contratos) | Documentado | Evento `fund_allocated` |
| M-05 | Media | Todos | Sin validación de `amount_xlm > 0`, `receipt_hash` de 32 bytes, ni unicidad de badge por org | Documentado + tests | Validación de inputs |
| M-06 | Media | Todos | Storage `persistent` sin `extend_ttl` — riesgo de archival | Documentado | TTL extend on write |
| M-07 | Media | `fund-tracker`, `expense-anchor` | IDs truncados a 12 chars (`Symbol`); riesgo de colisión si no hay convención | Documentado | — |
| L-08 | Baja | CI | Workflow usaba `wasm32-unknown-unknown`; README exige `wasm32v1-none` + `stellar contract build` | Corregido | — |
| L-09 | Baja | Todos | Comentarios en español en código Rust | Corregido | — |

---

## Matriz de consistencia

| Capacidad | `fund-tracker` | `expense-anchor` | `sbt-badge` |
|---|---|---|---|
| `initialize` idempotente | No | No | Sí (`already_initialized`) |
| `require_admin` en mutaciones | No | No | Sí |
| Emite eventos | No | Sí | Sí |
| Validación de inputs | No | No | Sí (badge types) |
| Parámetro org separado del signer | No | No | Sí (`organization`) |
| Tests unitarios | 7* | 9* | 16* |

\*Incluye tests de caracterización añadidos en esta auditoría.

---

## Detalle por hallazgo

### A-01 — Modelo de autorización

```rust
// fund-tracker/src/lib.rs
caller.require_auth();
organization: caller,
```

Cualquier dirección que firme la transacción queda registrada como `organization`/`submitted_by`. El backend NestJS usa `STELLAR_SERVER_SECRET` como signer único, por lo que on-chain siempre verá la wallet del servidor.

**Implicación:** la trazabilidad on-chain prueba que TrustBid attestó un registro, no que una ONG específica lo hizo directamente.

### A-02 — `initialize` no idempotente

`sbt-badge` protege con `panic!("already_initialized")`. Los otros dos contratos sobrescriben `Admin` silenciosamente en cada llamada.

### A-03 — `Admin` sin enforcement

`Admin` se almacena en `instance` storage durante `initialize` pero `allocate`/`anchor` no lo consultan. No hay control de acceso on-chain más allá de `caller.require_auth()`.

### M-04 — Sin eventos en `fund-tracker`

Indexadores off-chain deben hacer polling de `get_allocation` en lugar de suscribirse a eventos.

### M-05 — Sin validación de inputs

Comportamiento actual (verificado por tests de caracterización):

- `amount_xlm` negativo o cero: aceptado
- `receipt_hash` de cualquier longitud: aceptado
- Múltiples badges del mismo tipo para la misma org: permitido

### M-06 — Riesgo de TTL / archival

Soroban archiva entradas `persistent` cuando expira su TTL. Sin `extend_ttl` en writes, registros de auditoría pueden volverse inaccesibles. Estrategia recomendada: extender TTL en cada write (y opcionalmente en reads críticos).

### M-07 — Colisión de `Symbol`

Convención del backend: últimos 12 caracteres del UUID. Riesgo de colisión si dos UUIDs comparten sufijo. Mitigación: usar sufijos únicos o migrar a `Bytes`/`String` en versión futura.

---

## Backlog de hardening (priorizado)

Orden recomendado para cuando se salga del modo `audit_only`:

1. **Auth admin-proxy** — `require_admin` + parámetro explícito `organization`/`submitted_by` en `fund-tracker` y `expense-anchor`. Mayor impacto en integridad de auditoría. Requiere redeploy.
2. **`extend_ttl`** en writes de storage persistente. Crítico para supervivencia de datos de auditoría a largo plazo.
3. **Eventos en `fund-tracker`** + validación de inputs (`amount > 0`, `receipt_hash.len() == 32`). Aditivo para callers; requiere redeploy.
4. **`initialize` idempotente** en los tres contratos. Consistencia operacional.
5. **Validación cross-contract** — verificar que `project_id` existe en `fund-tracker` antes de anclar gasto.
6. **Upgrade SDK** 22 → 25 (evaluar breaking changes del ecosistema).

---

## Premisas no verificadas en este repo

- NestJS `SorobanService` pasa el address del servidor como `caller` en `allocate`/`anchor`.
- Postgres es la fuente de verdad para atribución org/usuario.
- Los IDs de 12 chars se generan con sufijo único en el backend.

---

## Criterios de aceptación de esta auditoría

- [x] `AUDIT.md` publicado con hallazgos clasificados
- [x] README alineado con comportamiento real
- [x] Tests de caracterización para edge cases documentados
- [x] CI alineado con `wasm32v1-none` + `stellar contract build`
- [x] Sin cambios de interfaz pública ni lógica de mutación en contratos
