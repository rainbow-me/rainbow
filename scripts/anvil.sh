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
anvil --fork-url "$ETHEREUM_MAINNET_RPC_DEV" "$@"
