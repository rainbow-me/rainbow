#!/bin/bash

set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GITHUB_PR_NUMBER:?GITHUB_PR_NUMBER is required}"

ARTIFACTS_DIR="e2e-artifacts/perf"
CURRENT_TTI_JSON="$ARTIFACTS_DIR/tti.json"
REPORT_DIR="$ARTIFACTS_DIR/report"
BASELINE_TTI_JSON=""

mkdir -p "$REPORT_DIR"

# Get baseline tti.json
echo "📥 Downloading baseline tti.json from latest develop artifact..."
ARTIFACT_ID=$(gh api \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/${GITHUB_REPOSITORY}/actions/artifacts" \
  -q ".artifacts | map(select(.name==\"perf-results-e2e-baseline-test\")) | sort_by(.updated_at) | reverse | .[0].id")

if [[ -n "$ARTIFACT_ID" ]]; then
  curl -L -H "Authorization: token $GITHUB_TOKEN" \
    -o baseline.zip \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/$ARTIFACT_ID/zip"
  unzip -o baseline.zip -d baseline-artifacts
  BASELINE_TTI_JSON=$(find baseline-artifacts -name 'tti.json' | head -n1)
fi

# Run comparison report
FLASHLIGHT_OUTPUT=""
if [[ -n "$BASELINE_TTI_JSON" && -f "$BASELINE_TTI_JSON" ]]; then
  echo "📊 Generating Flashlight report with baseline..."
  FLASHLIGHT_OUTPUT=$(flashlight report "$BASELINE_TTI_JSON" "$CURRENT_TTI_JSON" --output-dir "$REPORT_DIR")
else
  echo "⚠️ No baseline tti.json found, generating single report."
  FLASHLIGHT_OUTPUT=$(flashlight report "$CURRENT_TTI_JSON" --output-dir "$REPORT_DIR")
fi

# Build markdown
COMMENT_MARKER="<!-- flashlight-perf-comment -->"
COMMENT_BODY="$COMMENT_MARKER
🧪 **Flashlight Performance Report (AWS Device Farm)**

📎 [View Artifacts](https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}#artifacts)

$FLASHLIGHT_OUTPUT"

# Check if comment already exists
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

echo "✅ Comment posted or updated."
