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

LOG_FILE=$(mktemp)
@perf-profiler/maestro@latest start-session > "$LOG_FILE" 2>&1 &
SESSION_PID=$!

echo "⏳ Waiting for Maestro session to start..."
# Wait for log line to appear
while ! grep -q "Maestro session started. Keep this running in the background." "$LOG_FILE"; do
  if ! kill -0 "$SESSION_PID" 2>/dev/null; then
    echo "❌ Maestro session process died unexpectedly."
    cat "$LOG_FILE"
    exit 1
  fi
  sleep 0.5
done
echo "✅ Maestro session is ready."

npx @perf-profiler/maestro@latest test -e APP_ID="$APP_ID" e2e/utils/PreparePerf.yaml

mkdir -p e2e-artifacts/perf/results
flashlight test --bundleId "$APP_ID" \
  --testCommand "npx @perf-profiler/maestro@latest test -e APP_ID=\"$APP_ID\" e2e/perf/TTI.yaml" \
  --duration 20000 \
  --resultsFilePath e2e-artifacts/perf/results/tti.json \
  "$@"
