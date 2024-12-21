#!/bin/bash
set -e

# 0) Read build type from first argument; default to "release" if not specified
BUILD_TYPE=${1:-release}   # can be "debug" or "release"

# 0.1) Decide Detox config based on BUILD_TYPE
if [ "$BUILD_TYPE" = "debug" ]; then
  DETOX_CONFIG="ios.sim.debug"
else
  DETOX_CONFIG="ios.sim.release"
fi

# Loop through each file in the ./e2e/serial/ directory
for test_file in ./e2e/serial/*.ts; do
    echo "====================================="
    echo "Running test file: $test_file"
    echo "====================================="

    # 1) Start Anvil in the background (show logs in terminal + save to file)
    yarn anvil 2>&1 | grep -v "eth_" | tee anvil.log &
    ANVIL_PID=$!

    # 2) Wait for Anvil to initialize
    sleep 5

    # 3) Run Detox for this single file
    ./node_modules/.bin/detox test "$test_file" -c "$DETOX_CONFIG" --maxWorkers 1 --R 3
    ret_val=$?

    # 4) Kill the Anvil process
    echo "Killing Anvil (PID: $ANVIL_PID)"
    kill "$ANVIL_PID"

    # 5) Wait for Anvil to truly exit
    wait "$ANVIL_PID" 2>/dev/null || true

    # 5.1) Remove the Anvil log file
    rm -rf anvil.log

    # 6) Decide what to do if Detox failed or succeeded
    if [ "$ret_val" -ne 0 ]; then
      echo "❌ Tests failed for $test_file"
      exit 1  # or break, depending on your preference
    else
      echo "✅ Tests passed for $test_file"
    fi

done

echo "✅ All tests passed for every file!"
exit 0
