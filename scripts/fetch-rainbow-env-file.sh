#!/bin/bash
# Fetches a file from the private rainbow-me/rainbow-env repo into this repo.
# Usage: fetch-rainbow-env-file.sh <path-in-repo> [dest] [--optional] [--force]
#   dest        defaults to the same relative path as in rainbow-env
#   --optional  skip silently if dest exists; warn instead of fail when the fetch is unavailable
#   --force     fetch even if dest exists
# Auth: GITHUB_TOKEN if set, otherwise a token from the gh CLI.
set -uo pipefail

cd "$(dirname "$0")/.."

REPO_PATH=""
DEST=""
OPTIONAL=false
FORCE=false

for arg in "$@"; do
    case "$arg" in
        --optional) OPTIONAL=true ;;
        --force) FORCE=true ;;
        *)
            if [ -z "$REPO_PATH" ]; then REPO_PATH="$arg"
            elif [ -z "$DEST" ]; then DEST="$arg"
            else echo "error: unexpected argument: $arg" >&2; exit 1
            fi
            ;;
    esac
done

if [ -z "$REPO_PATH" ]; then
    echo "usage: $0 <path-in-repo> [dest] [--optional] [--force]" >&2
    exit 1
fi
DEST="${DEST:-$REPO_PATH}"

if [ -f "$DEST" ] && [ "$OPTIONAL" = true ] && [ "$FORCE" != true ]; then
    exit 0
fi

fail() {
    if [ "$OPTIONAL" = true ]; then
        echo "warning: $1; skipping $DEST" >&2
        exit 0
    fi
    echo "error: $1" >&2
    exit 1
}

TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}"
[ -n "$TOKEN" ] || fail "no GitHub credentials (run \`gh auth login\` or set GITHUB_TOKEN)"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -sf -H "Authorization: token $TOKEN" \
     -H 'Accept: application/vnd.github.v3.raw' \
     -L -o "$TMP" \
     "https://api.github.com/repos/rainbow-me/rainbow-env/contents/$REPO_PATH" \
    || fail "could not fetch $REPO_PATH from rainbow-env"

mkdir -p "$(dirname "$DEST")" || { echo "error: cannot create $(dirname "$DEST")" >&2; exit 1; }
mv "$TMP" "$DEST" || { echo "error: cannot write $DEST" >&2; exit 1; }
echo "$DEST installed from rainbow-env"
