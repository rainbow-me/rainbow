#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1

$ANDROID_HOME/platform-tools/adb shell install -r ./android/app/build/outputs/apk/release/app-release.apk

./scripts/e2e.sh
