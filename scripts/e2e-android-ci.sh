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
  ADB_LOG_FILE=$ARTIFACTS_FOLDER/adb/log_$DEVICE.log
  mkdir -p "$(dirname $ADB_LOG_FILE)"
  adb -s $DEVICE logcat -v time > $ADB_LOG_FILE &

  if [ $DEBUG = "true" ]; then
    adb -s $DEVICE shell "screenrecord --bugreport /data/local/tmp/recording.mp4 & echo \$! > /data/local/tmp/recording_pid_$DEVICE.txt" &
  fi
done

# Always start Anvil for CI runs
echo "Starting Anvil for tests..."

# Kill any existing Anvil process
echo "Cleaning up any existing Anvil processes..."
ANVIL_PID=$(lsof -t -i:8545 -c anvil 2>/dev/null)
if [ -n "$ANVIL_PID" ]; then
  kill $ANVIL_PID
fi
sleep 1

# Start Anvil in the background
echo "Starting Anvil..."
yarn anvil --host 0.0.0.0 &

echo "Waiting 5 seconds for Anvil to start..."
sleep 5

# Run the tests
./scripts/e2e-android.sh --device $DEVICES_LIST --debug-output $ARTIFACTS_FOLDER --flatten-debug-output "$SHARDS_FLAG" --bail-on-failure
TEST_STATUS=$?

# Clean up
for DEVICE in $DEVICES; do
  if [ $DEBUG = "true" ]; then
    adb -s $DEVICE shell "kill -2 \$(cat /data/local/tmp/recording_pid_$DEVICE.txt)"
    sleep 1
    adb -s $DEVICE pull /data/local/tmp/recording.mp4 $ARTIFACTS_FOLDER/recording_$DEVICE.mp4
  fi
done

ANVIL_PID=$(lsof -t -i:8545 -c anvil 2>/dev/null)
if [ -n "$ANVIL_PID" ]; then
  kill $ANVIL_PID
fi

exit $TEST_STATUS
