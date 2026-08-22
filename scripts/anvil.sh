#!/bin/bash

set -euo pipefail

# Get path to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# Load env
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

if [ -z "${RPC_PROXY_BASE_URL_PROD:-}" ] || [ -z "${RPC_PROXY_API_KEY_PROD:-}" ]; then
  echo "ERROR: RPC_PROXY_BASE_URL_PROD / RPC_PROXY_API_KEY_PROD missing from .env"
  exit 1
fi

ANVIL_FORK_BLOCK_NUMBER="${ANVIL_FORK_BLOCK_NUMBER:-24333000}"
if ! [[ "$ANVIL_FORK_BLOCK_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "ERROR: ANVIL_FORK_BLOCK_NUMBER must be a non-negative integer"
  exit 1
fi

ANVIL_FORK_URL="$RPC_PROXY_BASE_URL_PROD/1/$RPC_PROXY_API_KEY_PROD"

reset_fork() {
  local rpc_url="${1:?Usage: $0 reset <anvil-rpc-url>}"
  local payload
  local response

  payload=$(printf '{"jsonrpc":"2.0","id":1,"method":"anvil_reset","params":[{"forking":{"jsonRpcUrl":"%s","blockNumber":%s}}]}' "$ANVIL_FORK_URL" "$ANVIL_FORK_BLOCK_NUMBER")
  response=$(curl --silent --show-error --fail --max-time 10 \
    -H 'Content-Type: application/json' \
    --data "$payload" \
    "$rpc_url")

  [[ "$response" == *'"result"'* && "$response" != *'"error"'* ]]
}

if [ "${1:-}" = 'reset' ]; then
  shift
  reset_fork "$@"
  exit
fi

# Run anvil, passing through any flags from the calling script
# NOTE: Fork block should be updated periodically (e.g., monthly) to ensure
# Rainbow Router's swapTargets authorization list includes current DEX targets.
# Stale blocks cause TARGET_NOT_AUTH errors in swap e2e tests.
# Last updated: 2026-01-28 (block 24333000)
exec anvil --fork-url "$ANVIL_FORK_URL" --fork-block-number "$ANVIL_FORK_BLOCK_NUMBER" --block-base-fee-per-gas 100000000 --block-gas-limit 30000000 --steps-tracing "$@"
