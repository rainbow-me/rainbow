#!/bin/bash
set -euo pipefail

source .env

npm i -g @perf-profiler/maestro@latest

curl https://get.flashlight.dev | bash

export PATH="$PATH":"$HOME/.flashlight/bin"
export MAESTRO_DISABLE_UPDATE_CHECK=true
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

APP_ID="me.rainbow"

cleanup() {
  echo "Cleaning up..."

  if [ -n "${SESSION_PID:-}" ]; then
    kill "$SESSION_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

LOG_FILE=$(mktemp)
maestro start-session > "$LOG_FILE" 2>&1 &
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

echo "Running prepare step..."
maestro test -e APP_ID="$APP_ID" e2e/utils/PreparePerf.yaml

echo "Running Flashlight performance test..."
flashlight test --bundleId "$APP_ID" \
  --testCommand "maestro test -e APP_ID=\"$APP_ID\" e2e/perf/TTI.yaml" \
  --duration 20000 \
  --resultsFilePath $DEVICEFARM_LOG_DIR/tti.json \
  --iterationCount 10 \
  --resultsTitle "$RESULTS_TITLE"

echo "✅ Performance tests completed"
exit 0
