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

yarn start > /dev/null 2>&1 &
YARN_START_PID=$!

# Wait for Metro bundler to be ready
echo "⏳ Waiting for Metro bundler to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8081/status | grep -q "packager-status:running"; then
    echo "✅ Metro bundler is ready."

    echo "🚀 Triggering JS bundle build..."
    curl "http://localhost:8081/index.bundle?platform=ios&dev=true" --output /dev/null
    echo "✅ Bundle build triggered."
    
    break
  fi
  sleep 2
  echo "⌛ Still waiting... ($((i * 2))s)"
done

# Run tests with Maestro
./scripts/e2e-ios.sh --device "$DEVICE_UDID" --debug-output "$ARTIFACTS_FOLDER" --flatten-debug-output --app "$APP_PATH"

# Clean up Metro bundler
if [ -n "$YARN_START_PID" ]; then
  kill $YARN_START_PID || true
fi

TEST_STATUS=$?
exit $TEST_STATUS