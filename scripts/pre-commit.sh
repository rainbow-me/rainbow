#!/bin/bash
yarn lint-staged;

# Ignore any tracked changes to internals.
git update-index --assume-unchanged "ios/Internals/ios/Internals.h"
git update-index --assume-unchanged "ios/Internals/ios/Internals.m"
