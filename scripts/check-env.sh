#!/bin/bash

set -eo pipefail
source .env
echo "👀 Checking env vars..."
if [ -n "$ENABLE_DEV_MODE" -a "$ENABLE_DEV_MODE" = '0' ]; then
  
  if [ -n "$IS_TESTING" -a "$IS_TESTING" = 'false' ]; then
       echo "✅ Env vars are valid";
  else
    echo "❌  Invalid ENV var value for production build: IS_TESTING = ${IS_TESTING}";
    exit 1;
  fi
  
else
  echo "❌  Invalid ENV var value for production build: ENABLE_DEV_MODE = ${ENABLE_DEV_MODE}";
  exit 1;
fi