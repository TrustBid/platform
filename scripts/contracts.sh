#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/contracts/Cargo.toml"

cmd="${1:-}"

case "$cmd" in
  test)
    cargo test --manifest-path "$MANIFEST" --workspace "${@:2}"
    ;;
  build)
    (cd "$ROOT/contracts" && CARGO_TARGET_DIR=./target stellar contract build)
    ;;
  *)
    echo "Usage: $0 {test|build} [args...]" >&2
    exit 1
    ;;
esac
