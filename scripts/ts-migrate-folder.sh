#!/bin/bash
set -eo pipefail

FOLDER=$1

echo "Migrating folder $FOLDER...";

npx ts-migrate-full . --sources="$FOLDER/**/*" --sources="node_modules/**/*.d.ts" --sources="global.d.ts"
