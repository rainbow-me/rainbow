#!/bin/bash
yarn lint-staged;

RAINBOW_INTERNALS=(`find ios/Internals -type f`)
RAINBOW_INTERNALS_IGNORED=(`git ls-files -o ios/Internals`)

# Ignore any tracked changes to internals.
for i in "${RAINBOW_INTERNALS[@]}"
do
  # Only ignore changes to files which are permitted to be tracked,
  # i.e. they are *not* already specified within a .gitignore pattern.
  if [[ ! " ${RAINBOW_INTERNALS_IGNORED[@]} " =~ " $i " ]]; then
     git update-index --assume-unchanged "$i"
  fi
done
