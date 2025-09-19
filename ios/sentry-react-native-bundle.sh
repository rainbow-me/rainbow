#!/bin/sh
set -e

# Ensure we have default values when environment variables are missing.
PROJECT_ROOT="${SRCROOT:-$(cd "$(dirname "$0")" && pwd)}"
REACT_NATIVE_PATH="${REACT_NATIVE_PATH:-$PROJECT_ROOT/../node_modules/react-native}"
SENTRY_XCODE="$PROJECT_ROOT/../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"
REACT_NATIVE_XCODE="$REACT_NATIVE_PATH/scripts/react-native-xcode.sh"

if [ ! -f "$REACT_NATIVE_XCODE" ]; then
  echo "error: React Native Xcode script not found at $REACT_NATIVE_XCODE" >&2
  exit 1
fi

if [ ! -f "$SENTRY_XCODE" ]; then
  echo "warning: Sentry Xcode script missing at $SENTRY_XCODE; falling back to React Native bundler"
  exec /bin/sh "$REACT_NATIVE_XCODE"
fi

exec /bin/sh "$SENTRY_XCODE" "$REACT_NATIVE_XCODE"
