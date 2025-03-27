#!/bin/bash

source .env

# Check if we have the right number of arguments
if [ $# -eq 2 ]; then
  # New format: e2e.sh [device-id] [flow-file]
  DEVICE_ID="$1"
  FLOW_FILE="$2"
  
  # Build the proper paths and arguments
  DEVICE="--device $DEVICE_ID"
  FLOW="e2e-new/$FLOW_FILE"
else
  # Original format with flags
  FLOW="e2e-new"
  ARGS=()
  
  # Extract the flow flag to allow running only one suite of test and passthrough the rest of the arguments.
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --flow)
        FLOW="$2"
        shift
        ;;
      --device)
        DEVICE="--device $2"
        shift
        ;;
      *)
        ARGS+=("$1")
        ;;
    esac
    shift
  done
fi

echo "Running tests with:"
echo "  Device: $DEVICE"
echo "  Flow: $FLOW"

# Execute Maestro with the parameters
maestro $DEVICE test -e DEV_PKEY="$DEV_PKEY" -e APP_ID="me.rainbow" "${ARGS[@]}" "$FLOW"