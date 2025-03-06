#!/bin/bash -i

source .env

maestro test -e DEV_PKEY="$DEV_PKEY" -e APP_ID="me.rainbow" "${1:-./e2e}"
