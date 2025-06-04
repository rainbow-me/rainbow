#!/bin/bash

DEBUG=${DEBUG:-false}

if [ "$DEBUG" != "true" ] && [ -n "$ARCH" ]; then
  ARCHS_FLAG="-PreactNativeArchitectures=$ARCH"
fi

export SENTRY_DISABLE_AUTO_UPLOAD=true

yarn gradle assembleRelease $ARCHS_FLAG -PisE2E=true --no-daemon --build-cache --no-scan
