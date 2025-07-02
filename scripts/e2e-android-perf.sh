#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

APP_ID="me.rainbow"

maestro test -e APP_ID="$APP_ID" e2e/utils/PreparePerf.yaml

npx @perf-profiler/maestro@latest start-session &
SESSION_PID=$!

flashlight test --bundleId "$APP_ID" \
  --testCommand "npx @perf-profiler/maestro@latest test -e APP_ID=\"$APP_ID\" e2e/perf/TTI.yaml" \
  --duration 10000 \
  --resultsFilePath results.json

kill $SESSION_PID
