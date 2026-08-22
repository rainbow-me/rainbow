#!/bin/bash

set -euo pipefail
source .env

ARTIFACTS_FOLDER=e2e-artifacts
RESULTS_FOLDER=e2e-results
FLOW="e2e/flows"
ANVIL_RPC="http://127.0.0.1:8545"
TEST_WALLET_BALANCE_WEI="0x1158e460913d00000" # 20 ETH
ARGS=()
SHARD_TOTAL=1
SHARD_LABEL=1
TEST_FILES=()
ANVIL_PID=""
ANVIL_START_COUNT=0
TEST_WALLET_ADDRESS=""
PLATFORM=""
RECORD_ON_FAILURE=false
MAX_ATTEMPTS=1
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

stop_anvil() {
  if [ -n "${ANVIL_PID:-}" ]; then
    echo "🛑 Killing Anvil (PID: $ANVIL_PID)"
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
    ANVIL_PID=""
  fi
}

test_needs_anvil() {
  [[ "$1" == *'/transactions/'* ]]
}

wait_for_anvil() {
  local max_attempts="${ANVIL_READY_ATTEMPTS:-60}"
  if ! [[ "$max_attempts" =~ ^[1-9][0-9]*$ ]]; then
    echo "ANVIL_READY_ATTEMPTS must be a positive integer" >&2
    exit 2
  fi

  for attempt in $(seq 1 "$max_attempts"); do
    if cast block-number --rpc-url "$ANVIL_RPC" >/dev/null 2>&1; then
      echo "✅ Anvil ready at $ANVIL_RPC"
      return
    fi

    echo "⏳ Waiting for Anvil ($attempt/$max_attempts)..."
    sleep 1
  done

  echo "❌ Anvil did not become ready. See $ARTIFACTS_FOLDER/anvil/mainnet.log" >&2
  tail -n 100 "$ARTIFACTS_FOLDER/anvil/mainnet.log" >&2 || true
  exit 1
}

start_anvil() {
  echo "🔌 Starting Anvil..."

  while IFS= read -r existing_pid; do
    if [ -n "$existing_pid" ]; then
      kill "$existing_pid" 2>/dev/null || true
    fi
  done < <(lsof -t -i:8545 -c anvil 2>/dev/null || true)
  sleep 1

  mkdir -p "$ARTIFACTS_FOLDER/anvil"
  ANVIL_START_COUNT=$((ANVIL_START_COUNT + 1))
  printf '\n===== Anvil start %s at %s =====\n' "$ANVIL_START_COUNT" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$ARTIFACTS_FOLDER/anvil/mainnet.log"
  ./scripts/anvil.sh --host 0.0.0.0 >> "$ARTIFACTS_FOLDER/anvil/mainnet.log" 2>&1 &
  ANVIL_PID=$!
  wait_for_anvil
}

reset_anvil() {
  for attempt in 1 2 3; do
    if ./scripts/anvil.sh reset "$ANVIL_RPC" >/dev/null 2>&1; then
      echo "✅ Anvil reset to the configured fork block"
      wait_for_anvil
      return
    fi

    echo "⏳ Resetting Anvil ($attempt/3)..."
    sleep 0.2
  done

  return 1
}

fund_test_wallet() {
  # Derive the address from the imported key so a key change cannot silently fund
  # a different account and fail later as an insufficient-balance transaction.
  if [ -z "$TEST_WALLET_ADDRESS" ]; then
    TEST_WALLET_ADDRESS=$(cast wallet address --private-key "$DEV_PKEY")
  fi

  cast rpc anvil_setBalance "$TEST_WALLET_ADDRESS" "$TEST_WALLET_BALANCE_WEI" --rpc-url "$ANVIL_RPC" > /dev/null
  echo "💰 Funded $TEST_WALLET_ADDRESS with $(cast to-unit "$TEST_WALLET_BALANCE_WEI" ether) ETH"
}

prepare_anvil_for_attempt() {
  if [ -z "$ANVIL_PID" ]; then
    start_anvil
  elif ! reset_anvil; then
    echo "⚠️ Anvil reset failed. Restarting Anvil..."
    stop_anvil
    start_anvil
  fi

  fund_test_wallet
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
      SHARD_LABEL="$2"
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

if ! [[ "$SHARD_TOTAL" =~ ^[1-9][0-9]*$ && "$SHARD_LABEL" =~ ^[1-9][0-9]*$ ]] || ((SHARD_LABEL > SHARD_TOTAL)); then
  echo "Shard index must be between 1 and shard total" >&2
  exit 2
fi
if ! [[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]]; then
  echo "Retries must be a positive integer" >&2
  exit 2
fi
RESULTS_FILE="$RESULTS_FOLDER/shard-$SHARD_LABEL.jsonl"

json_string() {
  local s=${1//\\/\\\\}
  printf '"%s"' "${s//\"/\\\"}"
}

json_string_or_null() {
  if [ -z "${1:-}" ]; then printf 'null'; else json_string "$1"; fi
}

json_number_or_null() {
  if [ -z "${1:-}" ]; then printf 'null'; else printf '%s' "$1"; fi
}

test_id() {
  local id=${1#e2e/flows/}
  printf '%s' "${id%.yaml}"
}

# Every test is recorded as "planned" before the run starts, then superseded by
# an appended row when it finishes; the reader keeps the last row per test. So a
# shard killed partway through leaves its unrun tests as "planned" rather than
# leaving them out of the file altogether.
record() {
  printf '{"shard":%s,"platform":%s,"test":%s,"status":%s,"attempts":%s,"duration":%s,"pass_duration":%s,"failure_class":null,"artifact_dir":%s}\n' \
    "$SHARD_LABEL" "$(json_string "$PLATFORM")" "$(json_string "$1")" "$(json_string "$2")" \
    "$(json_number_or_null "${3:-}")" "$(json_number_or_null "${4:-}")" "$(json_number_or_null "${6:-}")" \
    "$(json_string_or_null "${5:-}")" \
    >> "$RESULTS_FILE"
}

record_planned() {
  local file
  for file in ${TEST_FILES[@]+"${TEST_FILES[@]}"}; do
    record "$(test_id "$file")" planned
  done
}

# Cleanup previous artifacts.
rm -rf "$ARTIFACTS_FOLDER" "$RESULTS_FOLDER"
mkdir -p "$RESULTS_FOLDER"

# Created before anything can go wrong, so that a missing ledger means the shard
# never got this far rather than that it had nothing to say. The summary reports
# on that difference.
: > "$RESULTS_FILE"

# Handle test discovery and sharding.
if [[ -f "$FLOW" ]]; then
  echo "🧪 Running single test file: $FLOW"
  TEST_FILES=("$FLOW")
else
  if [[ ! -d "$FLOW" ]]; then
    echo "Flow path does not exist: $FLOW" >&2
    exit 2
  fi

  if [[ $SHARD_TOTAL -gt 1 ]]; then
    SHARD_PLATFORM="${PLATFORM:-local}"
    HISTORY_FILE="${E2E_TIMINGS_FILE:-.cache/e2e-timings/$SHARD_PLATFORM.tsv}"
    SELECTION_FILE="$ARTIFACTS_FOLDER/sharding/selection.txt"
    PLAN_FILE="$ARTIFACTS_FOLDER/sharding/plan.tsv"
    node tools/e2e-sharding/index.ts plan "$SHARD_PLATFORM" "$SHARD_TOTAL" "$SHARD_LABEL" "$FLOW" "$HISTORY_FILE" "$SELECTION_FILE" "$PLAN_FILE"
    while IFS= read -r test_file; do
      if [ -n "$test_file" ]; then
        TEST_FILES+=("$test_file")
      fi
    done < "$SELECTION_FILE"
  else
    while IFS= read -r test_file; do
      TEST_FILES+=("$test_file")
    done < <(find "$FLOW" -name '*.yaml' -type f | sort)
  fi

  if [[ $SHARD_TOTAL -gt 1 ]]; then
    if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
      echo "⚠️ No tests selected for shard $SHARD_LABEL out of $SHARD_TOTAL"
      exit 0
    fi
    echo "🧪 Running shard $SHARD_LABEL/$SHARD_TOTAL:"
    printf ' - %s\n' "${TEST_FILES[@]}"
  fi
fi

record_planned

# Run tests with retries.
EXIT_CODE=0
for TEST_FILE in "${TEST_FILES[@]}"; do
  TEST_NAME=$(basename "${TEST_FILE%.*}")
  TEST_ID=$(test_id "$TEST_FILE")
  echo "🚀 Running test: $TEST_NAME"

  SUCCESS=false
  SHOULD_RECORD=false
  RESULT_DIR=""
  PASSED_ATTEMPT_DURATION=""
  TEST_START_TIME=$(date +%s)
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
      PASSED_ATTEMPT_DURATION=$DURATION
      echo "✅ Passed: $TEST_NAME (${DURATION}s, $ATTEMPT attempt(s))"
      echo

      # Stop recording (if recording was active)
      if [ "$SHOULD_RECORD" = "true" ]; then
        stop_recording "$DEBUG_OUTPUT"
      fi

      RESULT_DIR="✅-$TEST_NAME-$ATTEMPT"
      mv "$DEBUG_OUTPUT" "$ARTIFACTS_FOLDER/maestro/$RESULT_DIR"
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

      RESULT_DIR="❌-$TEST_NAME-$ATTEMPT"
      mv "$DEBUG_OUTPUT" "$ARTIFACTS_FOLDER/maestro/$RESULT_DIR"

      # Enable recording for subsequent attempts after failure
      if [ "$RECORD_ON_FAILURE" = "true" ]; then
        SHOULD_RECORD=true
      fi
    fi
  done

  TEST_DURATION=$(($(date +%s) - TEST_START_TIME))

  if $SUCCESS; then
    if [[ $ATTEMPT -eq 1 ]]; then
      STATUS=passed
    else
      STATUS=retried
    fi
  else
    STATUS=failed
    echo "❌ Failed after $MAX_ATTEMPTS attempt(s): $TEST_NAME"
    echo
    EXIT_CODE=1
  fi

  record "$TEST_ID" "$STATUS" "$ATTEMPT" "$TEST_DURATION" "$RESULT_DIR" "$PASSED_ATTEMPT_DURATION"
done

exit $EXIT_CODE
