#!/bin/bash

set -euo pipefail

export PATH="$PATH":"$HOME/.maestro/bin":"$HOME/.flashlight/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

# Required for posting results to PR.
: "${GITHUB_TOKEN:?Missing GITHUB_TOKEN}"
: "${GITHUB_RUN_ID:?Missing GITHUB_RUN_ID}"
: "${GITHUB_PR_NUMBER:?Missing GITHUB_PR_NUMBER}"
GITHUB_REPOSITORY=rainbow-me/rainbow
PERF_DIR=e2e-artifacts/perf
RESULTS_DIR="$PERF_DIR/results"
REPORT_DIR="$PERF_DIR/report"

# Install the app
echo "Install app"
$ANDROID_HOME/platform-tools/adb install -r $ARTIFACT_PATH_FOR_E2E

# Run the tests
./scripts/e2e-android-perf.sh --resultsTitle "Current (#${GITHUB_PR_NUMBER})" --iterationCount 10

mkdir -p "$REPORT_DIR"
flashlight report "$RESULTS_DIR" --output-dir "$REPORT_DIR"

RESULTS_JSON="$RESULTS_DIR/tti.json"

# Extract TTI, average FPS, average RAM
TTI=$(jq -r '.iterations[-1].time' "$RESULTS_JSON")
AVG_FPS=$(jq '[.iterations[].measures[].fps] | add / length' "$RESULTS_JSON")
AVG_RAM=$(jq '[.iterations[].measures[].ram] | add / length' "$RESULTS_JSON")

# Format numbers (to 1-2 decimal places)
TTI=$(printf "%.0f" "$TTI")
AVG_FPS=$(printf "%.2f" "$AVG_FPS")
AVG_RAM=$(printf "%.1f" "$AVG_RAM")

# Compose comment
COMMENT_BODY=$(cat <<EOF
🧪 **Flashlight Performance Report**

📎 [Download Report Artifact](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}#artifacts)

**Summary**
\`\`\`
Time to Interactive (TTI): ${TTI} ms
Average FPS: ${AVG_FPS}
Average RAM: ${AVG_RAM} MB
\`\`\`
EOF
)

# Post to PR
curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg body "$COMMENT_BODY" '{body: $body}')" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${GITHUB_PR_NUMBER}/comments"
