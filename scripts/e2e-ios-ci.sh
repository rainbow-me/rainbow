#!/bin/bash

set -e

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# Unpack the IPA to extract .app
# APP_PAYLOAD_PATH=$(mktemp -d)
# echo "🧪 Using IPA at: $ARTIFACT_PATH_FOR_E2E"
# unzip -q "$ARTIFACT_PATH_FOR_E2E" -d "$APP_PAYLOAD_PATH"
# APP_PATH=$(find "$APP_PAYLOAD_PATH" -name "*.app" -type d | head -n 1)

# if [[ -z "$APP_PATH" ]]; then
#   echo "Error: .app bundle not found in IPA"
#   exit 1
# fi

# Install the app
xcrun simctl install "$DEVICE_UDID" "$ARTIFACT_PATH_FOR_E2E"

# Run the tests
echo "Running tests..."
./scripts/e2e-ios.sh --device "$DEVICE_UDID" --debug-output "$ARTIFACTS_FOLDER" --flatten-debug-output --app "$ARTIFACT_PATH_FOR_E2E"
TEST_STATUS=$?

exit $TEST_STATUS
