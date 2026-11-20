#!/usr/bin/env bash
#
# Prepares a git worktree so it can typecheck, lint, test and build.
#
# A worktree is a fresh checkout and git brings tracked files only, so the
# gitignored files this repo needs (.env, src/config/debug.ts, the generated
# GraphQL types, node_modules) are all absent and every yarn script fails until
# they are put in place.
#
# Runs automatically via the SessionStart / SubagentStart hooks in
# .claude/settings.json and .codex/config.toml. Those fire on resume, /clear and
# compaction as well as on a new session, so this returns early once a worktree
# is set up.
#
# Safe to run by hand. No-ops entirely in the main checkout.

set -eo pipefail

MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
HERE=$(git rev-parse --show-toplevel)

# The main checkout owns its own dependencies.
if [ "$MAIN" = "$HERE" ]; then
  exit 0
fi

cd "$HERE"

# Gitignored files declared in .worktreeinclude. Claude Code copies these itself
# before this script runs, so the loop is a no-op there; it does the real work
# under Codex, which has no declarative equivalent.
if [ -f .worktreeinclude ]; then
  while IFS= read -r pattern || [ -n "$pattern" ]; do
    case "$pattern" in '' | '#'*) continue ;; esac
    pattern=${pattern%/}
    # Deliberately unquoted so glob patterns expand.
    for src in "$MAIN"/$pattern; do
      [ -e "$src" ] || continue
      rel=${src#"$MAIN"/}
      [ -e "$rel" ] && continue
      # Mirror .worktreeinclude semantics: never copy a git-tracked file.
      git -C "$MAIN" check-ignore -q "$rel" || continue
      mkdir -p "$(dirname "$rel")"
      cp -R "$src" "$rel"
    done
  done <.worktreeinclude
fi

# Any worktree that already has dependencies is left alone. yarn runs the root
# postinstall on every install, and postinstall appends to the ios/*.xcconfig
# files, so installing on every session would grow them without bound.
if [ -d node_modules ]; then
  exit 0
fi

# Installing from this branch's own lockfile and patches/ makes the tree correct
# by construction, with no reasoning about any other checkout's state. Around
# 23s against the warm global cache, though not a quick relink: yarn runs
# postinstall.sh, which rewrites the tree with rn-nodeify, applies patch-package
# and fires the RAINBOW_SCRIPTS_APP_*_PREBUILD_HOOK commands when set. Those
# hooks warn and continue here, since they point into rainbow-scripts, which a
# worktree doesn't have.
echo "🌱 Installing dependencies for $HERE..."
yarn install --immutable

if [ ! -d node_modules ]; then
  echo "✖ node_modules is still missing after install. Run 'yarn install' here to see why." >&2
  exit 1
fi

echo "✅ Worktree ready: $HERE"
