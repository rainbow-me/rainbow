#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# Install the app.
xcrun simctl install $DEVICE_UDID ios/build/Build/Products/Release-iphonesimulator/Rainbow.app

# Always start Anvil for CI runs
echo "Starting Anvil for tests..."

# Kill any existing Anvil process
echo "Cleaning up any existing Anvil processes..."
ANVIL_PID=$(lsof -t -i:8545 -c anvil 2>/dev/null)
if [ -n "$ANVIL_PID" ]; then
  kill $ANVIL_PID
fi
sleep 1

echo "Starting anvil..."
# Start Anvil in the background (show logs in terminal + save to file)
yarn anvil --host 0.0.0.0 2>&1 | grep -v "eth_" | tee anvil.log &
ANVIL_PID=$!
echo "Anvil started (PID: $ANVIL_PID)"

# Run the tests.
./scripts/e2e-ios.sh --device $DEVICE_UDID --debug-output $ARTIFACTS_FOLDER --flatten-debug-output

# Kill the Anvil process
echo "Killing Anvil (PID: $ANVIL_PID)"
kill "$ANVIL_PID" 2>/dev/null || true
# kill any other processes using port 8545
kill $(lsof -t -i:8545) 2>/dev/null || true

# Remove the Anvil log file
rm -rf anvil.log
