#!/bin/bash
set -euo pipefail

BASELINE=".ts-js-error-baseline"

if [ ! -f "$BASELINE" ]; then
  echo "Error: baseline file $BASELINE not found"
  exit 1
fi

# Extract TSxxxx codes from baseline (ignoring comments and descriptions)
baseline_pattern=$(grep -oE '^TS[0-9]+' "$BASELINE" | paste -sd '|' -)

# Run tsc with checkJs and capture JS file errors
js_errors=$(npx tsc --skipLibCheck --noEmit --checkJs 2>&1 | grep '\.js\b.*error TS' || true)

if [ -z "$js_errors" ]; then
  echo "No JS type errors found."
  exit 0
fi

# Find regressions: JS errors with codes NOT in the baseline
regressions=$(echo "$js_errors" | grep -vE "error ($baseline_pattern):" || true)

if [ -z "$regressions" ]; then
  baselined_count=$(echo "$js_errors" | wc -l | tr -d ' ')
  echo "All $baselined_count JS type errors are baselined. No regressions."
  exit 0
else
  regression_count=$(echo "$regressions" | wc -l | tr -d ' ')
  echo "Found $regression_count JS type error regression(s):"
  echo ""
  echo "$regressions"
  exit 1
fi
