#!/bin/bash

set -euo pipefail

ARTIFACT_ID="${1:?Usage: $0 <artifact-id> [output-path]}"
OUTPUT_PATH="${2:-artifact.zip}"
TMP_PATH="${OUTPUT_PATH}.tmp"
MAX_ATTEMPTS="${ARTIFACT_DOWNLOAD_ATTEMPTS:-8}"

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

ARTIFACT_URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/${ARTIFACT_ID}/zip"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  rm -f "$TMP_PATH"
  echo "Downloading artifact $ARTIFACT_ID (attempt $attempt/$MAX_ATTEMPTS)..."

  if curl --fail --location --silent --show-error \
    --retry 3 --retry-delay 2 --retry-all-errors \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -o "$TMP_PATH" \
    "$ARTIFACT_URL"; then
    if unzip -tq "$TMP_PATH" >/dev/null 2>&1; then
      mv "$TMP_PATH" "$OUTPUT_PATH"
      echo "Artifact saved to $OUTPUT_PATH"
      exit 0
    fi

    echo "Downloaded response is not a valid zip:" >&2
    head -c 500 "$TMP_PATH" >&2 || true
    echo >&2
  fi

  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    sleep $((attempt * 5))
  fi
done

echo "Failed to download a valid zip for artifact $ARTIFACT_ID" >&2
exit 1
