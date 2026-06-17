#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$FRONTEND_DIR"
mkdir -p .maestro/generated/screenshots .maestro/reports

echo "Running generated Sohokari Maestro suites from $FRONTEND_DIR"
for flow in .maestro/generated/[0-9][0-9]_*.yaml; do
  echo "==> $flow"
  maestro test "$flow"
done
