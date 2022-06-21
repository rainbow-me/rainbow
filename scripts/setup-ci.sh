#!/usr/bin/env bash
# fail if any commands fails
set -e
# debug log
set -x

# Yarn sucks and running a couple of times does the trick.
# See https://github.com/yarnpkg/yarn/issues/7212 before yelling at me

yarn setup || yarn setup || yarn setup

