#!/bin/bash

set -euo pipefail

source ./scripts/e2e-metro.sh

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_DISABLE_UPDATE_CHECK=true
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# TODO: Run release builds
start_metro ios

# Install the app on the simulator
xcrun simctl install "$DEVICE_UDID" "$ARTIFACT_PATH_FOR_E2E"

# Run the tests
./scripts/e2e-run.sh --shard-total ${SHARD_TOTAL:-1} --shard-index ${SHARD_INDEX:-1}
