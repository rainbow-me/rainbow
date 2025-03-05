#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=true
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ARTIFACTS_FOLDER="${ARTIFACTS_FOLDER:-e2e-artifacts}"

# Install the app.
xcrun simctl install $DEVICE_UDID ios/build/Build/Products/Release-iphonesimulator/Rainbow.app

# Run the tests.
./scripts/e2e-ios.sh --device $DEVICE_UDID --debug-output $ARTIFACTS_FOLDER --flatten-debug-output
