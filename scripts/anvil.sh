#!/bin/bash

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

# Run anvil, passing through any flags from the calling script
# NOTE: Fork block should be updated periodically (e.g., monthly) to ensure
# Rainbow Router's swapTargets authorization list includes current DEX targets.
# Stale blocks cause TARGET_NOT_AUTH errors in swap e2e tests.
# Last updated: 2025-01-28 (block 24333000)
anvil --fork-url "$ETHEREUM_MAINNET_RPC_DEV" --fork-block-number 24333000 --block-base-fee-per-gas 100000000 --block-gas-limit 30000000 --steps-tracing "$@"
