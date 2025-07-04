#!/bin/bash

set -euo pipefail

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DISABLE_UPDATE_CHECK=true
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

DEBUG="${DEBUG:-false}"
ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

cleanup() {
  echo "Cleaning up..."

  if [ "${DEBUG:-false}" = "true" ]; then
    echo "Stopping recording and pulling logs"
    adb shell "kill -2 \$(cat /data/local/tmp/recording_pid.txt)" || true
    sleep 1
    adb pull /data/local/tmp/recording.mp4 "$ARTIFACTS_FOLDER/recording.mp4" || true
  fi
}

trap cleanup EXIT INT TERM

# Install the app
echo "Install app"
adb install -r $ARTIFACT_PATH_FOR_E2E

# Setup logs and recordings
if [ $DEBUG = "true" ]; then
  echo "Debug mode enabled"
  ADB_LOG_FILE=$ARTIFACTS_FOLDER/adb/adb-log.log
  mkdir -p "$(dirname $ADB_LOG_FILE)"
  adb logcat -v time > $ADB_LOG_FILE &
  adb shell "screenrecord --bugreport /data/local/tmp/recording.mp4 & echo \$! > /data/local/tmp/recording_pid.txt" &
fi

# Run the tests
./scripts/e2e-run.sh --shard-total ${SHARD_TOTAL:-1} --shard-index ${SHARD_INDEX:-1}

