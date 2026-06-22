#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Activate the pinned Yarn (Yarn 4 via Corepack).
corepack enable >/dev/null 2>&1 || true

# Install JS dependencies. This also runs the root postinstall script, which:
#   - applies patch-package patches
#   - runs rn-nodeify
#   - creates src/config/debug.ts from the default if missing
# GraphQL types under src/graphql/__generated__ are committed, so `yarn lint:ts`,
# `yarn lint:js`, and `yarn test` work without running network-dependent codegen.
yarn install

echo "✅ Dependencies installed — lint and tests are ready."
