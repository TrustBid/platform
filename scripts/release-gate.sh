#!/usr/bin/env bash
# Unified release gate: offline contracts + type-check + unit tests.
# Testnet integration and API E2E are opt-in via RUN_INTEGRATION=1 and E2E_JWT.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Release gate: contracts:test =="
npm run contracts:test

echo ""
echo "== Release gate: contracts:build =="
npm run contracts:build

echo ""
echo "== Release gate: type-check =="
npm run type-check

echo ""
echo "== Release gate: SorobanService unit tests =="
npm run test --workspace=@trustbid/api -- --testPathPatterns=soroban.service.spec

if [ "${RUN_INTEGRATION:-0}" = "1" ]; then
  echo ""
  echo "== Release gate: contracts:integration =="
  npm run contracts:integration
fi

if [ -n "${E2E_JWT:-}" ]; then
  echo ""
  echo "== Release gate: contracts:api-e2e =="
  npm run contracts:api-e2e
fi

echo ""
echo "Release gate passed."
