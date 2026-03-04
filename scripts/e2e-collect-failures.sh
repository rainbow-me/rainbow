#!/bin/bash
# e2e-collect-failures.sh — Collect failed tests from e2e results across shards
#
# Usage: ./scripts/e2e-collect-failures.sh <artifacts-dir>
# Output (stdout): FAILED_TESTS=test1,test2  FAILED_FLOWS=flow1,flow2
# Exit 0 if failures found, exit 1 if no failures.
#
# For GitHub Actions, writes to $GITHUB_OUTPUT if set.

set -euo pipefail

ARTIFACTS_DIR="${1:-.}"

FAILED_TESTS=""
FAILED_FLOWS=""

# Read all shard result files
for f in "$ARTIFACTS_DIR"/e2e-results-shard-*.jsonl; do
  [ -f "$f" ] || continue
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    status=$(echo "$line" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['status'])" 2>/dev/null || echo "")
    [ "$status" != "failed" ] && continue
    test=$(echo "$line" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['test'])")
    flow=$(echo "$line" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['flow'])")
    # Deduplicate
    if [[ "$FAILED_TESTS" != *"$test"* ]]; then
      FAILED_TESTS="${FAILED_TESTS:+$FAILED_TESTS,}$test"
      FAILED_FLOWS="${FAILED_FLOWS:+$FAILED_FLOWS,}$flow"
    fi
  done < "$f"
done

if [ -z "$FAILED_TESTS" ]; then
  echo "No failed tests found"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "skip=true" >> "$GITHUB_OUTPUT"
  fi
  exit 1
fi

echo "Failed: $FAILED_TESTS"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  
  echo "failed_flows=$FAILED_FLOWS" >> "$GITHUB_OUTPUT"
  echo "skip=false" >> "$GITHUB_OUTPUT"
fi

# Also export for callers that source this
export FAILED_TESTS FAILED_FLOWS
