#!/bin/bash

source .env

FLOW=e2e-new
ARGS=()

# Extract the flow flag to allow running only one suite of test and passthrough the rest of the arguments.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --flow)
      FLOW="$2"
      shift
      ;;
    --device)
      DEVICE="$1 $2"
      shift
      ;;
    *)
      ARGS+=("$1")
      ;;
  esac
  shift
done

maestro $DEVICE test -e DEV_PKEY="$DEV_PKEY" -e APP_ID="me.rainbow" "${ARGS[@]}" "$FLOW"
