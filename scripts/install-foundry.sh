#!/bin/bash

set -euo pipefail

FOUNDRY_VERSION="${FOUNDRY_VERSION:-v1.5.1}"
FOUNDRY_BIN_DIR="${FOUNDRY_BIN_DIR:-.foundry-bin}"
FOUNDRY_DOWNLOAD_ATTEMPTS="${FOUNDRY_DOWNLOAD_ATTEMPTS:-8}"

resolve_platform() {
  case "$(uname -s)" in
    Darwin) echo darwin ;;
    Linux) echo linux ;;
    *)
      echo "Unsupported Foundry platform: $(uname -s)" >&2
      exit 1
      ;;
  esac
}

resolve_arch() {
  case "$(uname -m)" in
    arm64 | aarch64) echo arm64 ;;
    x86_64 | amd64) echo amd64 ;;
    *)
      echo "Unsupported Foundry architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac
}

anvil_matches_version() {
  if [ ! -x "$FOUNDRY_BIN_DIR/anvil" ]; then
    return 1
  fi

  if [ "$FOUNDRY_VERSION" = "stable" ]; then
    "$FOUNDRY_BIN_DIR/anvil" --version >/dev/null 2>&1
    return
  fi

  "$FOUNDRY_BIN_DIR/anvil" --version | grep -q "${FOUNDRY_VERSION#v}"
}

add_foundry_to_path() {
  if [ -n "${GITHUB_PATH:-}" ]; then
    echo "$FOUNDRY_BIN_DIR" >> "$GITHUB_PATH"
  fi
}

mkdir -p "$FOUNDRY_BIN_DIR"
FOUNDRY_BIN_DIR="$(cd "$FOUNDRY_BIN_DIR" && pwd)"

if anvil_matches_version; then
  echo "Using Foundry from $FOUNDRY_BIN_DIR"
  "$FOUNDRY_BIN_DIR/anvil" --version
  add_foundry_to_path
  exit 0
fi

platform="$(resolve_platform)"
arch="$(resolve_arch)"
archive_name="foundry_${FOUNDRY_VERSION}_${platform}_${arch}.tar.gz"
download_url="https://github.com/foundry-rs/foundry/releases/download/${FOUNDRY_VERSION}/${archive_name}"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

for attempt in $(seq 1 "$FOUNDRY_DOWNLOAD_ATTEMPTS"); do
  echo "Downloading Foundry ${FOUNDRY_VERSION} for ${platform}/${arch} (attempt ${attempt}/${FOUNDRY_DOWNLOAD_ATTEMPTS})..."
  rm -f "$tmp_dir/$archive_name"

  if curl --fail --location --silent --show-error \
    --retry 3 --retry-delay 2 --retry-all-errors \
    --connect-timeout 10 --max-time 120 \
    -o "$tmp_dir/$archive_name" \
    "$download_url"; then
    break
  fi

  if [ "$attempt" -eq "$FOUNDRY_DOWNLOAD_ATTEMPTS" ]; then
    echo "Failed to download Foundry from $download_url" >&2
    exit 1
  fi

  sleep $((attempt * 5))
done

mkdir -p "$tmp_dir/extract"
tar -xzf "$tmp_dir/$archive_name" -C "$tmp_dir/extract"

for binary in anvil cast chisel forge; do
  if [ -f "$tmp_dir/extract/$binary" ]; then
    install -m 0755 "$tmp_dir/extract/$binary" "$FOUNDRY_BIN_DIR/$binary"
  fi
done

"$FOUNDRY_BIN_DIR/anvil" --version
add_foundry_to_path
