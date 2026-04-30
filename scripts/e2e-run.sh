#!/bin/bash

set -euo pipefail
source .env

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"
ANVIL_FORK_BLOCK_NUMBER="${ANVIL_FORK_BLOCK_NUMBER:-24333000}"
ANVIL_RPC_URL="http://127.0.0.1:8545"
FLOW="e2e/flows"
ARGS=()
SHARD_TOTAL=1
SHARD_INDEX=0
TEST_FILES=()
ANVIL_PID=""
PLATFORM=""
RECORD_ON_FAILURE=false
MAX_ATTEMPTS=1
RECORDING_PID=""
LOG_CAPTURE_PID=""
ANVIL_START_COUNT=0

stop_log_capture() {
  if [ -n "${LOG_CAPTURE_PID:-}" ]; then
    echo "📋 Stopping adb logcat capture..."
    kill "$LOG_CAPTURE_PID" 2>/dev/null || true
    wait "$LOG_CAPTURE_PID" 2>/dev/null || true
    LOG_CAPTURE_PID=""
  fi
}

start_log_capture() {
  local log_dir=$1

  if [ "$PLATFORM" = "android" ]; then
    echo "📋 Starting adb logcat capture..."
    mkdir -p "$log_dir"
    adb logcat -c >/dev/null 2>&1 || true
    adb logcat -v time > "$log_dir/logcat.txt" &
    LOG_CAPTURE_PID=$!
  fi
}

wait_for_anvil() {
  local rpc_url="${1:-$ANVIL_RPC_URL}"
  local max_attempts="${ANVIL_READY_ATTEMPTS:-30}"

  for attempt in $(seq 1 "$max_attempts"); do
    if response=$(curl --silent --show-error --fail --max-time 2 \
      -H 'Content-Type: application/json' \
      --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
      "$rpc_url" 2>/dev/null) && [[ "$response" == *'"result"'* ]]; then
      echo "✅ Anvil ready at $rpc_url"
      return 0
    fi

    echo "⏳ Waiting for Anvil ($attempt/$max_attempts)..."
    sleep 1
  done

  echo "❌ Anvil did not become ready at $rpc_url" >&2
  tail -n 100 "$ARTIFACTS_FOLDER/anvil/mainnet.log" >&2 || true
  exit 1
}

test_needs_anvil() {
  [[ "$1" == *"/transactions/"* ]]
}

stop_anvil() {
  if [ -n "${ANVIL_PID:-}" ]; then
    echo "🛑 Killing Anvil (PID: $ANVIL_PID)"
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
    ANVIL_PID=""
  fi
}

start_anvil() {
  echo "🔌 Starting Anvil..."

  local existing_pid
  existing_pid=$(lsof -t -i:8545 -c anvil 2>/dev/null || true)
  if [ -n "$existing_pid" ]; then kill "$existing_pid" 2>/dev/null || true; fi
  sleep 1

  mkdir -p "$ARTIFACTS_FOLDER/anvil"
  ANVIL_START_COUNT=$((ANVIL_START_COUNT + 1))
  printf '\n===== Anvil start %s at %s =====\n' "$ANVIL_START_COUNT" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$ARTIFACTS_FOLDER/anvil/mainnet.log"
  ANVIL_FORK_BLOCK_NUMBER="$ANVIL_FORK_BLOCK_NUMBER" ./scripts/anvil.sh --host 0.0.0.0 >> "$ARTIFACTS_FOLDER/anvil/mainnet.log" 2>&1 &
  ANVIL_PID=$!
  wait_for_anvil "$ANVIL_RPC_URL"
}

reset_anvil() {
  local payload
  payload=$(printf '{"jsonrpc":"2.0","id":1,"method":"anvil_reset","params":[{"forking":{"jsonRpcUrl":"%s","blockNumber":%s}}]}' "$ETHEREUM_MAINNET_RPC_DEV" "$ANVIL_FORK_BLOCK_NUMBER")

  for attempt in 1 2 3; do
    if response=$(curl --silent --show-error --fail --max-time 10 \
      -H 'Content-Type: application/json' \
      --data "$payload" \
      "$ANVIL_RPC_URL" 2>/dev/null) && [[ "$response" == *'"result"'* && "$response" != *'"error"'* ]]; then
      echo "✅ Anvil reset to fork block $ANVIL_FORK_BLOCK_NUMBER"
      return 0
    fi

    echo "⏳ Resetting Anvil ($attempt/3)..."
    sleep 0.2
  done

  return 1
}

prepare_anvil_for_attempt() {
  if [ -z "${ANVIL_PID:-}" ]; then
    start_anvil
    return
  fi

  if reset_anvil; then return; fi

  echo "⚠️ Anvil reset failed. Restarting Anvil..."
  stop_anvil
  start_anvil
}

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
  stop_log_capture
  stop_anvil
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
    --retries)
      MAX_ATTEMPTS="$2"
      shift
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

# Run tests with retries.
EXIT_CODE=0
for TEST_FILE in "${TEST_FILES[@]}"; do
  TEST_NAME=$(basename "${TEST_FILE%.*}")
  echo "🚀 Running test: $TEST_NAME"

  SUCCESS=false
  SHOULD_RECORD=false
  for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "🔁 Attempt $ATTEMPT for $TEST_NAME"

    START_TIME=$(date +%s)
    DEBUG_OUTPUT="$ARTIFACTS_FOLDER/maestro/⏱️-$TEST_NAME-$ATTEMPT"

    if test_needs_anvil "$TEST_FILE"; then
      prepare_anvil_for_attempt
    fi

    # Start recording for attempts after first failure
    if [ "$SHOULD_RECORD" = "true" ]; then
      start_recording "$DEBUG_OUTPUT"
      start_log_capture "$DEBUG_OUTPUT"
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
        stop_log_capture
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
        stop_log_capture
      fi

      mv "$DEBUG_OUTPUT" "$ARTIFACTS_FOLDER/maestro/❌-$TEST_NAME-$ATTEMPT"

      # Enable recording for subsequent attempts after failure
      if [ "$RECORD_ON_FAILURE" = "true" ]; then
        SHOULD_RECORD=true
      fi
    fi
  done


  if ! $SUCCESS; then
    echo "❌ Failed after $MAX_ATTEMPTS attempt(s): $TEST_NAME"
    echo
    EXIT_CODE=1
  fi
done


exit $EXIT_CODE
