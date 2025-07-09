#!/bin/bash

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

FLOW=e2e
ARGS=()

# Extract the flow flag to allow running only one suite of test and passthrough the rest of the arguments.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --flow)
      FLOW="$2"
      shift
      ;;
    --device)
      DEVICE="$1 $2"
      shift
      ;;
    *)
      ARGS+=("$1")
      ;;
  esac
  shift
done

# Check if we're running all tests or a transaction test
if [[ $FLOW == *"transaction"* || $FLOW == "e2e" ]]; then
  echo "Transaction test detected."

  # Kill any existing Anvil process
  echo "Cleaning up any existing Anvil processes..."
  ANVIL_PID=$(lsof -t -i:8545 -a -c anvil 2>/dev/null)
  if [ -n "$ANVIL_PID" ]; then
    kill $ANVIL_PID
  fi
  sleep 1

  # Start Anvil in the background (show logs in terminal + save to file)
  bash ./scripts/anvil.sh --host 0.0.0.0 2>&1 | grep -v "eth_" | tee anvil.log &
  ANVIL_PID=$!
  echo "Anvil started (PID: $ANVIL_PID)"

  # Wait for Anvil to initialize
  sleep 5
fi

# Run the Maestro test
maestro $DEVICE -p Android test -e DEV_PKEY="$DEV_PKEY" -e APP_ID="me.rainbow" -e CLOUD_BACKUP_EMAIL="$CLOUD_BACKUP_EMAIL" -e CLOUD_BACKUP_PASSWORD="$CLOUD_BACKUP_PASSWORD" "${ARGS[@]}" "$FLOW"

# Store the exit code
EXIT_CODE=$?

# Kill the Anvil process
if [ -n "$ANVIL_PID" ]; then
  echo "Killing Anvil (PID: $ANVIL_PID)"
  kill "$ANVIL_PID" 2>/dev/null || true
fi
# kill any other processes using port 8545
lsof -t -i:8545 -a -c anvil | xargs kill

# Remove the Anvil log file
rm -rf anvil.log

# Exit with the test exit code
exit $EXIT_CODE
