#!/bin/bash

# Regenerate the per-platform dependency-cruiser baselines consumed by
# `yarn lint:deps` (.dependency-cruiser-known-violations.{ios,android}.json).
# These grandfather pre-existing rule violations so only net-new ones fail CI.
#
# Run this after fixing baselined violations to ratchet the baselines down so
# the fixed ones can't quietly return. Introducing a NEW violation does not
# require this; the CI check fails on anything not already baselined.
#
# dependency-cruiser resolves a single platform per run (foo.ios / foo.android),
# so a violation living only in one platform's variant is invisible to the other
# run. We keep one baseline per platform so each run is checked against exactly
# the violations that can ship on it.

set -euo pipefail

cd "$(dirname "$0")/.."

for platform in ios android; do
  baseline=".dependency-cruiser-known-violations.$platform.json"
  echo "Cruising ($platform)..."
  DEPCRUISE_PLATFORM="$platform" depcruise index.js \
    --config .dependency-cruiser.cjs \
    --output-type baseline > "$baseline"
  count="$(node -e "process.stdout.write(String(require('./$baseline').length))")"
  echo "✅ Wrote $count grandfathered violations to $baseline"
done
