#!/bin/bash

set -euo pipefail

# There is no simctl command for enrollment. The Simulator's Features menu posts
# this notification and LAContext acts on it immediately. Since that is
# undocumented, check it took rather than assume: a silent no-op would otherwise
# surface far downstream.

KEY="com.apple.BiometricKit.enrollmentChanged"
DEVICE="${DEVICE_UDID:-booted}"

xcrun simctl spawn "$DEVICE" notifyutil -s "$KEY" 1
xcrun simctl spawn "$DEVICE" notifyutil -p "$KEY"

STATE=$(xcrun simctl spawn "$DEVICE" notifyutil -g "$KEY" | awk '{print $2}')
if [ "$STATE" != "1" ]; then
  echo "❌ Face ID enrollment did not take: $KEY reads '${STATE:-unset}'"
  echo "   Check whether the notification key still exists on this Xcode version."
  exit 1
fi

echo "🙂 Face ID enrolled on $DEVICE"
