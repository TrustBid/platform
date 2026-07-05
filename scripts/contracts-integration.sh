#!/usr/bin/env bash
# Caatinga + bindings + SorobanService integration against testnet.
# Requires: Stellar CLI identity (default trustbid), apps/api/.env.local with STELLAR_SERVER_SECRET.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${CAATINGA_NETWORK:-testnet}"
SOURCE="${CAATINGA_SOURCE:-trustbid}"

cd "$ROOT"

echo "== Caatinga doctor =="
npx caatinga doctor --network "$NETWORK" --source "$SOURCE"

echo ""
echo "== Caatinga status =="
npx caatinga status --network "$NETWORK"

echo ""
echo "== Caatinga smoke (config-based read-only verification) =="
npx caatinga smoke --network "$NETWORK" --source "$SOURCE"

echo ""
echo "== SorobanService + bindings integration (tsx) =="
npx tsx scripts/soroban-integration.ts

echo ""
echo "== API HTTP E2E (optional — set E2E_JWT to enable) =="
E2E_SKIP="${E2E_SKIP:-1}"
if [ -n "${E2E_JWT:-}" ]; then
  E2E_SKIP=0 npx tsx scripts/integration/api-http.ts
else
  echo "Skipped (set E2E_JWT + running API to enable Sprint 8)"
fi

echo ""
echo "Integration suite passed."
