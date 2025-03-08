#!/bin/bash

export PATH="$PATH":"$HOME/.maestro/bin"

adb shell install -r ./android/app/build/outputs/apk/release/app-release.apk

./scripts/e2e.sh
