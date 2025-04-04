#!/bin/bash

DEBUG=${DEBUG:-false}

if [ "$DEBUG" != "true" ] && [ -n "$ARCH" ]; then
  SHARDS_FLAG="-PreactNativeArchitectures=$ARCH"
fi

yarn gradle assembleRelease $SHARDS_FLAG -PisE2E=true
