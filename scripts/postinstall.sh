#!/bin/bash
set -eo pipefail

# Execute the prebuild script, if defined. Note, this is just useful for CI.
# You don't need to have this variable defined in order to use the project.
if [ -n "$RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK" ]; then
  eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK;
  echo "✅ executed ios prebuild hook"
fi

# Ignore any potential tracked changes to mutable Internals.
git update-index --assume-unchanged "ios/Internals/ios/Internals.h"
git update-index --assume-unchanged "ios/Internals/ios/Internals.m"
git update-index --assume-unchanged "ios/Internals/ios/Internals.swift"

# When installing, new native modules may have been installed so we'll attempt to
# cache these here to avoid synchronization errors.
yarn install-bundle && yarn install-pods
echo "✅ pods installed successfully"

# Specifying ONLY the node packages that we need to install via browserify
# (because those aren't available in react native) and some of our deps require them.
# If we don't specify which packages, rn-nodeify  will look into each package.json
# and install everything including a bunch devDeps that we don't need like "console"
rn-nodeify --install --hack 'crypto,buffer,react-native-randombytes,vm,stream,http,https,os,url,net,fs,process'
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

patch-package
echo "✅ All patches applied"

