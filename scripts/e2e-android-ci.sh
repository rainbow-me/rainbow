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
    echo "Debug mode enabled for $DEVICE"
    ADB_LOG_FILE=$ARTIFACTS_FOLDER/adb/log_$DEVICE.log
    mkdir -p "$(dirname $ADB_LOG_FILE)"
    adb -s $DEVICE logcat -v time > $ADB_LOG_FILE &
    adb -s $DEVICE shell "screenrecord --bugreport /data/local/tmp/recording.mp4 & echo \$! > /data/local/tmp/recording_pid_$DEVICE.txt" &
  fi
done

# Run the tests
./scripts/e2e-android.sh --device $DEVICES_LIST --debug-output $ARTIFACTS_FOLDER --flatten-debug-output $SHARDS_FLAG --flow ./e2e/screens/MaliciousDappTransactionWarning.yaml
TEST_STATUS=$?

# Clean up
for DEVICE in $DEVICES; do
  if [ $DEBUG = "true" ]; then
    adb -s $DEVICE shell "kill -2 \$(cat /data/local/tmp/recording_pid_$DEVICE.txt)"
    sleep 1
    adb -s $DEVICE pull /data/local/tmp/recording.mp4 $ARTIFACTS_FOLDER/recording_$DEVICE.mp4
  fi
done

exit $TEST_STATUS
