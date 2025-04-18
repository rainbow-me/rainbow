#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

DEBUG="${DEBUG:-false}"
ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"
SHARDS_FLAG="--shard-split ${SHARDS:-1}"

DEVICES=$(adb devices | awk 'NR>1 && $1 != "" {print $1}')
DEVICES_LIST=$(echo "$DEVICES" | paste -sd "," -)

echo "Running on devices: $DEVICES_LIST"

# Install the app
for DEVICE in $DEVICES; do
  echo "Install app on $DEVICE"
  $ANDROID_HOME/platform-tools/adb -s "$DEVICE" install -r ./android/app/build/outputs/apk/release/app-release.apk &
done
wait

# Setup logs and recordings
for DEVICE in $DEVICES; do
  if [ $DEBUG = "true" ]; then
    ADB_LOG_FILE=$ARTIFACTS_FOLDER/adb/log_$DEVICE.log
    mkdir -p "$(dirname $ADB_LOG_FILE)"
    adb -s $DEVICE logcat -v time > $ADB_LOG_FILE &
    adb -s $DEVICE shell "screenrecord --bugreport /data/local/tmp/recording.mp4 & echo \$! > /data/local/tmp/recording_pid_$DEVICE.txt" &
  fi
done

# Always start Anvil for CI runs
echo "Starting Anvil for tests..."

# Kill any existing Anvil process
ANVIL_PID=$(lsof -t -i:8545 -c anvil 2>/dev/null)
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

# Run the tests
./scripts/e2e-android.sh --device $DEVICES_LIST --debug-output $ARTIFACTS_FOLDER --flatten-debug-output $SHARDS_FLAG
TEST_STATUS=$?

# Clean up
for DEVICE in $DEVICES; do
  if [ $DEBUG = "true" ]; then
    adb -s $DEVICE shell "kill -2 \$(cat /data/local/tmp/recording_pid_$DEVICE.txt)"
    sleep 1
    adb -s $DEVICE pull /data/local/tmp/recording.mp4 $ARTIFACTS_FOLDER/recording_$DEVICE.mp4
  fi
done

# Kill the Anvil process
echo "Killing Anvil (PID: $ANVIL_PID)"
kill "$ANVIL_PID" 2>/dev/null || true
# kill any other processes using port 8545
kill $(lsof -t -i:8545) 2>/dev/null || true

# Remove the Anvil log file
rm -rf anvil.log

exit $TEST_STATUS
