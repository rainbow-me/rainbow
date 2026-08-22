#!/bin/bash

set -euo pipefail

ARTIFACT_ID="${1:?Usage: $0 <artifact-id> [output-path]}"
OUTPUT_PATH="${2:-artifact.zip}"
TEMP_PATH="${OUTPUT_PATH}.tmp"
MAX_ATTEMPTS="${ARTIFACT_DOWNLOAD_ATTEMPTS:-8}"

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

if ! [[ "$ARTIFACT_ID" =~ ^[1-9][0-9]*$ ]]; then
  echo "Artifact ID must be a positive integer" >&2
  exit 2
fi
if ! [[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]]; then
  echo "ARTIFACT_DOWNLOAD_ATTEMPTS must be a positive integer" >&2
  exit 2
fi

ARTIFACT_URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/${ARTIFACT_ID}/zip"

cleanup() {
  rm -f "$TEMP_PATH"
}
trap cleanup EXIT

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  rm -f "$TEMP_PATH"
  echo "Downloading artifact $ARTIFACT_ID (attempt $attempt/$MAX_ATTEMPTS)..."

  if curl --fail --location --silent --show-error \
    --retry 3 --retry-delay 2 --retry-all-errors \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    -o "$TEMP_PATH" \
    "$ARTIFACT_URL" &&
    unzip -tq "$TEMP_PATH" >/dev/null 2>&1; then
    mv "$TEMP_PATH" "$OUTPUT_PATH"
    echo "Artifact saved to $OUTPUT_PATH"
    exit 0
  fi

  echo "Artifact download failed or returned an invalid zip" >&2
  if ((attempt < MAX_ATTEMPTS)); then
    sleep $((attempt * 5))
  fi
done

echo "Failed to download a valid artifact zip for $ARTIFACT_ID" >&2
exit 1
