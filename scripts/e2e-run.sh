#!/bin/bash

set -euo pipefail
source .env

ARTIFACTS_FOLDER=e2e-artifacts
FLOW="e2e/flows"
ARGS=()
SHARD_TOTAL=1
SHARD_INDEX=0
TEST_FILES=()
ANVIL_PID=""
PLATFORM=""
RECORD_ON_FAILURE=false
RECORDING_PID=""

# Stop recording function
stop_recording() {
  local recording_dir=$1

  if [ -n "${RECORDING_PID:-}" ]; then
    echo "🎥 Stopping recording..."

    if [ "$PLATFORM" = "android" ]; then
      adb shell "kill -2 \$(cat /data/local/tmp/recording_pid.txt)" 2>/dev/null || true
      sleep 2
      adb pull /data/local/tmp/recording.mp4 "$recording_dir/recording.mp4" 2>/dev/null || true
      adb shell "rm -f /data/local/tmp/recording.mp4 /data/local/tmp/recording_pid.txt" 2>/dev/null || true
    elif [ "$PLATFORM" = "ios" ]; then
      kill -INT "$RECORDING_PID" 2>/dev/null || true
      wait "$RECORDING_PID" 2>/dev/null || true
    fi
    RECORDING_PID=""
    echo "🎥 Recording saved to $recording_dir/recording.mp4"
  fi
}

# Start recording function
start_recording() {
  local recording_dir=$1

  echo "🎥 Starting screen recording..."
  mkdir -p "$recording_dir"

  if [ "$PLATFORM" = "android" ]; then
    adb shell "screenrecord --bugreport /data/local/tmp/recording.mp4 & echo \$! > /data/local/tmp/recording_pid.txt" &
    # Placeholder recording PID for android, since it is saved on the device.
    RECORDING_PID="android"
  elif [ "$PLATFORM" = "ios" ]; then
    if [ -n "${DEVICE_UDID:-}" ]; then
      xcrun simctl io "$DEVICE_UDID" recordVideo --codec=h264 "$recording_dir/recording.mp4" &
      RECORDING_PID=$!
    else
      xcrun simctl io booted recordVideo --codec=h264 "$recording_dir/recording.mp4" &
      RECORDING_PID=$!
    fi
  fi
}

# Trap cleanup.
cleanup() {
  # Stop any ongoing recording without parameters (for emergency cleanup)
  if [ -n "${RECORDING_PID:-}" ]; then
    echo "🎥 Emergency cleanup - stopping recording..."
    if [ "$PLATFORM" = "android" ]; then
      adb shell "kill -2 \$(cat /data/local/tmp/recording_pid.txt)" 2>/dev/null || true
    elif [ "$PLATFORM" = "ios" ]; then
      kill -INT "$RECORDING_PID" 2>/dev/null || true
    fi
    RECORDING_PID=""
  fi
  if [ -n "${ANVIL_PID:-}" ]; then
    echo "🛑 Killing Anvil (PID: $ANVIL_PID)"
    kill "$ANVIL_PID" 2>/dev/null || true
  fi
  kill $(lsof -t -i:8545) 2>/dev/null || true
}

handle_interrupt() {
  cleanup
  exit 130
}

trap cleanup EXIT
trap handle_interrupt INT TERM

# Parse arguments.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --flow)
      FLOW="$2"
      shift
      ;;
    --shard-total)
      SHARD_TOTAL="$2"
      shift
      ;;
    --shard-index)
      # Ensure SHARD_INDEX is zero-based.
      SHARD_INDEX=$(( $2 - 1 ))
      shift
      ;;
    --platform)
      PLATFORM="$2"
      shift
      ;;
    --record-on-failure)
      RECORD_ON_FAILURE=true
      ;;
    *)
      ARGS+=("$1")
      ;;
  esac
  shift
done

# Cleanup previous artifacts.
rm -rf "$ARTIFACTS_FOLDER"

# Handle test discovery and sharding.
if [[ -f "$FLOW" ]]; then
  echo "🧪 Running single test file: $FLOW"
  TEST_FILES=("$FLOW")
else
  ALL_TESTS=($(find "$FLOW" -name '*.yaml' | sort))
  for i in "${!ALL_TESTS[@]}"; do
    if (( i % SHARD_TOTAL == SHARD_INDEX )); then
      TEST_FILES+=("${ALL_TESTS[$i]}")
    fi
  done

  if [[ $SHARD_TOTAL -gt 1 ]]; then
    if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
      echo "⚠️ No tests selected for shard $SHARD_INDEX out of $SHARD_TOTAL"
      exit 0
    fi
    echo "🧪 Running shard $((SHARD_INDEX + 1))/$SHARD_TOTAL:"
    printf ' - %s\n' "${TEST_FILES[@]}"
  fi
fi

# Start Anvil only if any test path includes "transaction".
NEEDS_ANVIL=false
for FILE in "${TEST_FILES[@]}"; do
  if [[ "$FILE" == *"/transactions/"* ]]; then
    NEEDS_ANVIL=true
    break
  fi
done

if $NEEDS_ANVIL; then
  echo "🔌 Transaction test detected. Starting Anvil..."

  ANVIL_PID=$(lsof -t -i:8545 -c anvil 2>/dev/null || true)
  if [ -n "$ANVIL_PID" ]; then kill "$ANVIL_PID" 2>/dev/null || true; fi
  sleep 1

  mkdir -p "$ARTIFACTS_FOLDER/anvil"
  ./scripts/anvil.sh --host 0.0.0.0 > "$ARTIFACTS_FOLDER/anvil/mainnet.log" 2>&1 &
  ANVIL_PID=$!
  sleep 5
fi

# Run tests with retries.
EXIT_CODE=0
for TEST_FILE in "${TEST_FILES[@]}"; do
  TEST_NAME=$(basename "${TEST_FILE%.*}")
  echo "🚀 Running test: $TEST_NAME"

  SUCCESS=false
  SHOULD_RECORD=false
  for ATTEMPT in {1..3}; do
    echo "🔁 Attempt $ATTEMPT for $TEST_NAME"

    START_TIME=$(date +%s)
    DEBUG_OUTPUT="$ARTIFACTS_FOLDER/maestro/⏱️-$TEST_NAME-$ATTEMPT"

    # Start recording for attempts after first failure
    if [ "$SHOULD_RECORD" = "true" ]; then
      start_recording "$DEBUG_OUTPUT"
    fi

    CMD=(maestro test
      --config e2e/config.yaml
      -e DEV_PKEY="$DEV_PKEY"
      -e APP_ID="me.rainbow"
      --debug-output "$DEBUG_OUTPUT"
      --flatten-debug-output
    )

    if [[ ${#ARGS[@]} -gt 0 ]]; then
      CMD+=("${ARGS[@]}")
    fi
    CMD+=("$TEST_FILE")

    if "${CMD[@]}"; then
      END_TIME=$(date +%s)
      DURATION=$((END_TIME - START_TIME))
      SUCCESS=true
      echo "✅ Passed: $TEST_NAME (${DURATION}s, $ATTEMPT attempt(s))"
      echo

      # Stop recording (if recording was active)
      if [ "$SHOULD_RECORD" = "true" ]; then
        stop_recording "$DEBUG_OUTPUT"
      fi

      mv "$DEBUG_OUTPUT" "$ARTIFACTS_FOLDER/maestro/✅-$TEST_NAME-$ATTEMPT"
      break
    else
      END_TIME=$(date +%s)
      DURATION=$((END_TIME - START_TIME))
      echo "⚠️ Attempt $ATTEMPT failed for $TEST_NAME (${DURATION}s)"
      echo

      # Stop recording (if recording was active)
      if [ "$SHOULD_RECORD" = "true" ]; then
        stop_recording "$DEBUG_OUTPUT"
      fi

      mv "$DEBUG_OUTPUT" "$ARTIFACTS_FOLDER/maestro/❌-$TEST_NAME-$ATTEMPT"

      # Enable recording for subsequent attempts after failure
      if [ "$RECORD_ON_FAILURE" = "true" ]; then
        SHOULD_RECORD=true
      fi
    fi
  done


  if ! $SUCCESS; then
    echo "❌ Failed after 3 attempts: $TEST_NAME"
    echo
    EXIT_CODE=1
  fi
done


exit $EXIT_CODE
