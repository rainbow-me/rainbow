#!/bin/bash


# 0) Read build type from first argument; default to "release" if not specified
BUILD_TYPE=${1:-release}   # can be "debug" or "release"

# 0.1) Decide Detox config based on BUILD_TYPE
if [ "$BUILD_TYPE" = "debug" ]; then
  DETOX_CONFIG="ios.sim.debug"
else
  DETOX_CONFIG="ios.sim.release"
fi

./node_modules/.bin/detox test ./e2e/parallel/ -c "$DETOX_CONFIG" --maxWorkers 2 --R 3
