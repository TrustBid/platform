#!/usr/bin/env bash
# Full regression pipeline (Sprint 9 — S9-05).
# Runs offline tests, build, generate, integration smoke against testnet.
# Skips redeploy by default; set REGRESSION_DEPLOY=1 to include deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/docs/test-runs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/regression-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee -a "$LOG") 2>&1

echo "== Regression pipeline started $(date -Iseconds) =="

echo ""
echo "== S9-05 step 1: contracts:test =="
npm run contracts:test

echo ""
echo "== S9-05 step 2: contracts:build =="
npm run contracts:build

if [ "${REGRESSION_DEPLOY:-0}" = "1" ]; then
  echo ""
  echo "== S9-05 step 3: contracts:deploy =="
  npm run contracts:deploy
else
  echo ""
  echo "== S9-05 step 3: deploy skipped (set REGRESSION_DEPLOY=1 to deploy) =="
fi

echo ""
echo "== S9-05 step 4: contracts:generate =="
npm run contracts:generate

echo ""
echo "== S9-04: binding freshness gate =="
NETWORK="${CAATINGA_NETWORK:-testnet}"
STATUS_OUT="$(npx caatinga status --network "$NETWORK" 2>&1 || true)"
echo "$STATUS_OUT"
if echo "$STATUS_OUT" | grep -qiE '\bstale\b'; then
  echo "S9-04 FAILED: bindings are stale — run npm run contracts:generate after deploy"
  exit 1
fi
if echo "$STATUS_OUT" | grep -qiE '\bmissing\b'; then
  echo "S9-04 FAILED: bindings missing — run npm run contracts:generate"
  exit 1
fi
echo "S9-04 passed: no stale or missing bindings"

echo ""
echo "== S9-05 step 5: contracts:integration =="
npm run contracts:integration

echo ""
echo "== S9-05 step 6: SorobanService unit tests =="
npm run test --workspace=@trustbid/api -- --testPathPatterns=soroban.service.spec

echo ""
echo "== Regression pipeline passed. Log: $LOG =="
