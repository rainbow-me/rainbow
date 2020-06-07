#!/bin/bash

set -o pipefail

patch-package
echo "✅ All patches applied"

rn-nodeify --install --hack
echo "✅ rn-nodeify packages hacked succesfully"

if [ -e .env ]
then
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/debug.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/release.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/localrelease.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/staging.xcconfig
  echo "✅ .xcconfig files created"

  source .env
  echo "✅ Android ENV vars exported"

else
  echo "⚠️ .env file missing!! ⚠️"
  echo "Please make sure the file exists and it's located in the root of the project"
fi

