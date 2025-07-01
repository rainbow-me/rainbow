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
# might as well pin things where we can for stability and consistency
anvil --fork-url "$ETHEREUM_MAINNET_RPC_DEV"  --fork-block-number 22000000 --block-base-fee-per-gas 100000000 --block-gas-limit 30000000 "$@"
