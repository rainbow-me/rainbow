#!/bin/bash

DEBUG=${DEBUG:-false}

if [ "$DEBUG" != "true" ] && [ -n "$ARCH" ]; then
  ARCHS_FLAG="-PreactNativeArchitectures=$ARCH"
fi

yarn gradle assembleRelease $ARCHS_FLAG -PisE2E=true --no-daemon --build-cache --no-scan
