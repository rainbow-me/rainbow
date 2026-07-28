#!/usr/bin/env bash
#
# Prepares a git worktree so it can typecheck, lint, test and build.
#
# A worktree is a fresh checkout and git brings tracked files only, so the
# gitignored files this repo needs (.env, src/config/debug.ts, the generated
# GraphQL types, node_modules) are all absent and every yarn script fails until
# they are put in place.
#
# Runs automatically, once per worktree:
#   - Claude Code, via the SessionStart / SubagentStart hooks in .claude/settings.json
#   - Codex, via .codex/setup.sh
#
# Safe to run by hand and safe to run repeatedly; it no-ops once a worktree is
# set up, and no-ops entirely in the main checkout.

set -eo pipefail

MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
HERE=$(git rev-parse --show-toplevel)

# The main checkout owns its own dependencies; there is nothing to prepare.
if [ "$MAIN" = "$HERE" ]; then
  exit 0
fi

cd "$HERE"

# Copy-on-write where the filesystem supports it (APFS clone, btrfs/XFS
# reflink), plain copy elsewhere. Cloning node_modules costs about 46MB and 30s
# rather than 2.2GB and several minutes.
clone() {
  cp -c -R "$1" "$2" 2>/dev/null ||
    cp -R --reflink=auto "$1" "$2" 2>/dev/null ||
    cp -R "$1" "$2"
}

# Gitignored files declared in .worktreeinclude. Claude Code copies these itself
# before this script runs, so the loop is a no-op there; it does the real work
# under Codex, which has no declarative equivalent.
if [ -f .worktreeinclude ]; then
  while IFS= read -r pattern || [ -n "$pattern" ]; do
    case "$pattern" in '' | '#'*) continue ;; esac
    pattern=${pattern%/}
    # Deliberately unquoted so patterns such as ios/*.xcconfig glob.
    for src in "$MAIN"/$pattern; do
      [ -e "$src" ] || continue
      rel=${src#"$MAIN"/}
      [ -e "$rel" ] && continue
      # Mirror .worktreeinclude semantics: never copy a git-tracked file.
      git -C "$MAIN" check-ignore -q "$rel" || continue
      mkdir -p "$(dirname "$rel")"
      clone "$src" "$rel"
    done
  done <.worktreeinclude
fi

if [ -d node_modules ]; then
  exit 0
fi

# The main checkout's node_modules is a valid tree only for the main checkout's
# lockfile. An identical lockfile makes cloning correct by construction; a
# different one means this branch resolves different packages (or different
# entries in patches/) and has to install.
if cmp -s yarn.lock "$MAIN/yarn.lock"; then
  echo "🌱 Lockfiles match; cloning node_modules from $MAIN..."
  clone "$MAIN/node_modules" node_modules
else
  echo "🌱 Lockfile differs from the main checkout; installing..."
  yarn install --immutable
fi

echo "✅ Worktree ready: $HERE"
