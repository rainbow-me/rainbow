#!/bin/bash -i

source .env

maestro test -e DEV_PKEY="$DEV_PKEY" -e APP_ID="me.rainbow" ./e2e
