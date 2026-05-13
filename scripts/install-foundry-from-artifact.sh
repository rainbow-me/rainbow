#!/bin/bash

set -euo pipefail

ARTIFACT_ID="${1:?Usage: $0 <artifact-id>}"
FOUNDRY_BIN_DIR="${FOUNDRY_BIN_DIR:-.foundry-bin}"
TMP_DIR="$(mktemp -d)"
ARTIFACT_ZIP="${2:-$TMP_DIR/foundry-artifact.zip}"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

./scripts/download-github-artifact.sh "$ARTIFACT_ID" "$ARTIFACT_ZIP"

rm -rf "$FOUNDRY_BIN_DIR"
mkdir -p "$FOUNDRY_BIN_DIR"
FOUNDRY_BIN_DIR="$(cd "$FOUNDRY_BIN_DIR" && pwd)"

unzip -q "$ARTIFACT_ZIP" -d "$TMP_DIR"
tar -xzf "$TMP_DIR/foundry-bin.tar.gz" -C "$FOUNDRY_BIN_DIR"
chmod +x "$FOUNDRY_BIN_DIR"/*

"$FOUNDRY_BIN_DIR/anvil" --version

if [ -n "${GITHUB_PATH:-}" ]; then
  echo "$FOUNDRY_BIN_DIR" >> "$GITHUB_PATH"
fi
