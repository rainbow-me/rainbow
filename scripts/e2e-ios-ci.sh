#!/bin/bash

set -e

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

echo "🔍 Checking archive path: $ARTIFACT_PATH_FOR_E2E"

if [[ ! -f "$ARTIFACT_PATH_FOR_E2E" ]]; then
  echo "❌ Archive not found at $ARTIFACT_PATH_FOR_E2E"
  echo "📂 Current directory: $(pwd)"
  echo "📁 Available files:"
  ls -lh
  exit 1
fi

# Extract .tar.gz and locate .app bundle
APP_UNPACK_DIR=$(mktemp -d)
tar -xzf "$ARTIFACT_PATH_FOR_E2E" -C "$APP_UNPACK_DIR"

APP_PATH=$(find "$APP_UNPACK_DIR" -name "*.app" -type d | head -n 1)

if [[ -z "$APP_PATH" ]]; then
  echo "❌ .app bundle not found in extracted archive"
  exit 1
fi

echo "✅ Found .app at: $APP_PATH"

# Install the app on the simulator
xcrun simctl install "$DEVICE_UDID" "$APP_PATH"

yarn start &
# Run tests with Maestro
./scripts/e2e-ios.sh --device "$DEVICE_UDID" --debug-output "$ARTIFACTS_FOLDER" --flatten-debug-output --app "$APP_PATH"

# Clean up yarn start process
YARN_START_PID=$(lsof -t -i:8081)
if [ -n "$YARN_START_PID" ]; then
  kill $YARN_START_PID
fi

TEST_STATUS=$?
exit $TEST_STATUS