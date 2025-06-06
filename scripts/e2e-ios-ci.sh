#!/bin/bash

set -e

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# Debug output
echo "📦 Installing IPA from: $ARTIFACT_PATH_FOR_E2E"
echo "📱 Using Simulator: $DEVICE_UDID"

# Install the app
xcrun simctl install "$DEVICE_UDID" "$ARTIFACT_PATH_FOR_E2E"

# Run the tests
echo "🚀 Running tests..."
./scripts/e2e-ios.sh --device "$DEVICE_UDID" --debug-output "$ARTIFACTS_FOLDER" --flatten-debug-output --app "$ARTIFACT_PATH_FOR_E2E"
TEST_STATUS=$?

exit $TEST_STATUS
