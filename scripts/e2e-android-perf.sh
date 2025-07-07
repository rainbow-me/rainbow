#!/bin/bash

set -euo pipefail

APP_ID="me.rainbow"

cleanup() {
  echo "Cleaning up..."

  if [ -n "${SESSION_PID:-}" ]; then
    kill "$SESSION_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

npx @perf-profiler/maestro@latest start-session &
SESSION_PID=$!

sleep 5

npx @perf-profiler/maestro@latest test -e APP_ID="$APP_ID" e2e/utils/PreparePerf.yaml

mkdir -p e2e-artifacts/perf/results
flashlight test --bundleId "$APP_ID" \
  --testCommand "npx @perf-profiler/maestro@latest test -e APP_ID=\"$APP_ID\" e2e/perf/TTI.yaml" \
  --duration 10000 \
  --resultsFilePath e2e-artifacts/perf/results/tti.json \
  "$@"
