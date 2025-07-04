#!/bin/bash

set -euo pipefail

export PATH="$PATH:$HOME/.flashlight/bin"

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GITHUB_PR_NUMBER:?GITHUB_PR_NUMBER is required}"
: "${GITHUB_COMMIT:?GITHUB_COMMIT is required}"

ARTIFACTS_DIR="e2e-artifacts/perf"
CURRENT_TTI_JSON="$ARTIFACTS_DIR/tti.json"
REPORT_DIR="$ARTIFACTS_DIR/report"
BASELINE_TTI_JSON=""
mkdir -p "$REPORT_DIR"

# Try to get baseline tti.json
echo "📥 Looking for baseline artifact..."
ARTIFACT_ID=$(gh api --paginate \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/${GITHUB_REPOSITORY}/actions/artifacts" \
  -q ".artifacts | map(select(.name==\"perf-results-e2e-baseline-test\")) | sort_by(.updated_at) | reverse | .[0].id" || echo "")

if [[ -n "$ARTIFACT_ID" ]]; then
  echo "✅ Found baseline artifact with ID: $ARTIFACT_ID"
  curl -sSL -H "Authorization: token $GITHUB_TOKEN" \
    -o baseline.zip \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/$ARTIFACT_ID/zip"
  unzip -o baseline.zip -d baseline-artifacts

  BASELINE_TTI_JSON=$(find baseline-artifacts -name 'tti.json' | head -n1)
  if [[ -n "$BASELINE_TTI_JSON" && -f "$BASELINE_TTI_JSON" ]]; then
    echo "✅ Found baseline tti.json at: $BASELINE_TTI_JSON"
  else
    echo "⚠️ No tti.json found inside baseline artifact."
    BASELINE_TTI_JSON=""
  fi
else
  echo "⚠️ No baseline artifact found."
fi

# Generate report for visuals only
if [[ -n "$BASELINE_TTI_JSON" && -f "$BASELINE_TTI_JSON" ]]; then
  flashlight report "$BASELINE_TTI_JSON" "$CURRENT_TTI_JSON" --output-dir "$REPORT_DIR" >/dev/null
else
  flashlight report "$CURRENT_TTI_JSON" --output-dir "$REPORT_DIR" >/dev/null
fi

# Parse metrics from current run
AVG_TTI=$(jq '[.iterations[].time] | add / length' "$CURRENT_TTI_JSON")
AVG_FPS=$(jq '[.iterations[].measures[].fps] | add / length' "$CURRENT_TTI_JSON")
AVG_RAM=$(jq '[.iterations[].measures[].ram] | add / length' "$CURRENT_TTI_JSON")

# Format values
AVG_TTI=$(printf "%.0f" "$AVG_TTI")
AVG_FPS=$(printf "%.2f" "$AVG_FPS")
AVG_RAM=$(printf "%.1f" "$AVG_RAM")

# Default baseline values
TTI_ROW="| Time to Interactive (TTI) | **${AVG_TTI} ms** | – |"
FPS_ROW="| Average FPS | **${AVG_FPS}** | – |"
RAM_ROW="| Average RAM | **${AVG_RAM} MB** | – |"

# Calculate differences if baseline exists
if [[ -n "$BASELINE_TTI_JSON" && -f "$BASELINE_TTI_JSON" ]]; then
  BASELINE_TTI=$(jq '[.iterations[].time] | add / length' "$BASELINE_TTI_JSON")
  BASELINE_FPS=$(jq '[.iterations[].measures[].fps] | add / length' "$BASELINE_TTI_JSON")
  BASELINE_RAM=$(jq '[.iterations[].measures[].ram] | add / length' "$BASELINE_TTI_JSON")

  function diff_row() {
    local label="$1"
    local unit="$2"
    local current="$3"
    local baseline="$4"
    local diff=$(awk "BEGIN { print $current - $baseline }")
    local pct=$(awk "BEGIN { print ($current - $baseline) / $baseline * 100 }")

    local arrow color abs_pct
    abs_pct=$(awk "BEGIN { print ($pct < 0 ? -$pct : $pct) }")

    if (( $(echo "$abs_pct < 1" | bc -l) )); then
      arrow="–"
      color="⚪"
    elif (( $(echo "$diff > 0" | bc -l) )); then
      arrow="▲"
      color="🔴"
    elif (( $(echo "$diff < 0" | bc -l) )); then
      arrow="▼"
      color="🟢"
    else
      arrow="–"
      color="⚪"
    fi

    diff=$(printf "%+.1f" "$diff")
    pct=$(printf "%+.1f" "$pct")

    printf "| %s | %s %s | %s %s %s (%s%%) |\n" "$label" "$current" "$unit" "$color" "$diff" "$unit" "$pct"
  }

  TTI_ROW=$(diff_row "Time to Interactive (TTI)" "ms" "$TTI" "$BASELINE_TTI")
  FPS_ROW=$(diff_row "Average FPS" "" "$AVG_FPS" "$BASELINE_FPS")
  RAM_ROW=$(diff_row "Average RAM" "MB" "$AVG_RAM" "$BASELINE_RAM")
fi

# Compose comment
COMMENT_MARKER="<!-- flashlight-perf-comment -->"
COMMENT_BODY=$(cat <<EOF
$COMMENT_MARKER
🧪 **Flashlight Performance Report (AWS Device Farm)**

🔀 Commit: ${GIT_COMMIT}

📎 [View Artifacts](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}#artifacts)

| Metric                     | Current         | Δ vs Baseline          |
|----------------------------|-----------------|------------------------|
$TTI_ROW
$FPS_ROW
$RAM_ROW
EOF
)

# Post or update PR comment
COMMENTS_API="https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${GITHUB_PR_NUMBER}/comments"
EXISTING_COMMENT_ID=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" "$COMMENTS_API" |
  jq -r ".[] | select(.body | contains(\"$COMMENT_MARKER\")) | .id")

if [[ -n "$EXISTING_COMMENT_ID" ]]; then
  echo "♻️ Updating existing comment (ID: $EXISTING_COMMENT_ID)"
  curl -s -X PATCH \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --arg body "$COMMENT_BODY" '{body: $body}')" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/comments/${EXISTING_COMMENT_ID}"
else
  echo "💬 Posting new comment to PR #$GITHUB_PR_NUMBER"
  curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --arg body "$COMMENT_BODY" '{body: $body}')" \
    "$COMMENTS_API"
fi

echo "✅ Flashlight performance comment posted."
