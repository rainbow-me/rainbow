#!/bin/bash

set -euo pipefail

# A freshly booted simulator has Face ID available but not enrolled. The app reads
# that as passcode-only, which disables hold-to-authorize and relabels the send
# button, so the send journeys can't run at all and iOS would otherwise be testing
# an interaction almost no user gets.
#
# There is no simctl command for enrollment. The Simulator's Features menu posts
# this notification and LAContext acts on it immediately. Since that is
# undocumented, check it took rather than assume: a silent no-op here surfaces as
# an unrelated-looking element-not-found several steps into the send flows.

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
