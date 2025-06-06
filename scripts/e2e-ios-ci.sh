#!/bin/bash

set -e

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# Extract .tar.gz and find the .app
APP_UNPACK_DIR=$(mktemp -d)
tar -xzf "$ARTIFACT_PATH_FOR_E2E" -C "$APP_UNPACK_DIR"
APP_PATH=$(find "$APP_UNPACK_DIR" -name "*.app" -type d | head -n 1)

if [[ -z "$APP_PATH" ]]; then
  echo "❌ .app bundle not found in extracted archive"
  exit 1
fi

# Install the app
xcrun simctl install "$DEVICE_UDID" "$APP_PATH"

# Run the tests
echo "🚀 Running tests..."
./scripts/e2e-ios.sh --device "$DEVICE_UDID" --debug-output "$ARTIFACTS_FOLDER" --flatten-debug-output --app "$APP_PATH"
TEST_STATUS=$?

exit $TEST_STATUS
