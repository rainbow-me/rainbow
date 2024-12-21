#!/bin/bash
MAX_RETRIES=${1:-3} # number of times that a test should be retried in case of failure. default to 3 if not specified
BUILD_TYPE=${2:-release}   # can be "debug" or "release". default to "release" if not specified


# 0.1) Decide Detox config based on BUILD_TYPE
if [ "$BUILD_TYPE" = "debug" ]; then
  DETOX_CONFIG="ios.sim.debug"
else
  DETOX_CONFIG="ios.sim.release"
fi

SUCCESS=false

# Loop through each file in the ./e2e/serial/ directory
for test_file in ./e2e/serial/*.ts; do
  COUNT=0
  until (( $COUNT >= MAX_RETRIES ))
    do
      echo "====================================="
      echo "Running test file: $test_file (attempt ${COUNT+1}/$MAX_RETRIES)"
      echo "====================================="

      echo "Starting anvil..."
      # 1) Start Anvil in the background (show logs in terminal + save to file)
      yarn anvil 2>&1 | grep -v "eth_" | tee anvil.log &
      ANVIL_PID=$!
      echo "Anvil started (PID: $ANVIL_PID)"

      # 2) Wait for Anvil to initialize
      sleep 5

      # 3) Run Detox for this single file with retries
      ./node_modules/.bin/detox test "$test_file" -c "$DETOX_CONFIG" --maxWorkers 1
      ret_val=$?

      # 4) Kill the Anvil process
      echo "Killing Anvil (PID: $ANVIL_PID)"
      kill "$ANVIL_PID" 2>/dev/null || true
      # kill any other processes using port 8545
      kill $(lsof -t -i:8545) 2>/dev/null || true

      # 5) Remove the Anvil log file
      rm -rf anvil.log


      # 6) Decide what to do if Detox failed or succeeded
      if [ $ret_val -eq 0 ]; then
        echo "✅ Tests passed for $test_file"
        SUCCESS=true
        break
      fi
      ((COUNT++))
      echo "❌ Test failed, attempt $COUNT/$MAX_RETRIES..."
      
      if(($COUNT >= MAX_RETRIES))
      then
        SUCCESS=false
      fi
    done

    if [ "$SUCCESS" = "false" ]; then
      echo "❌ Tests failed after $MAX_RETRIES attempts. Bailing out!"
      exit 1
    fi
done

echo "✅ All tests passed for every file!"
exit 0



