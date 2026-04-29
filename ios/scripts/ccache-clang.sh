#!/bin/sh
set -e

export CCACHE_CONFIGPATH="${CCACHE_CONFIGPATH:-$HOME/Library/Preferences/ccache/ccache.conf}"

if command -v ccache >/dev/null 2>&1; then
  exec ccache clang "$@"
fi

exec clang "$@"
