#!/bin/bash
set -eo pipefail

if [ -e .env ]
then
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/debug.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/release.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/localrelease.xcconfig
  cat .env | grep "BRANCH" | sed 's/=/ = /g' > ./ios/staging.xcconfig
  
  cat .env | grep "CODEPUSH" | sed 's/=/ = /g' >> ./ios/debug.xcconfig
  cat .env | grep "CODEPUSH" | sed 's/=/ = /g' >> ./ios/release.xcconfig
  cat .env | grep "CODEPUSH" | sed 's/=/ = /g' >> ./ios/localrelease.xcconfig
  cat .env | grep "CODEPUSH" | sed 's/=/ = /g' >> ./ios/staging.xcconfig

  cat .env | grep "GOOGLE" | sed 's/=/ = /g' >> ./ios/debug.xcconfig
  cat .env | grep "GOOGLE" | sed 's/=/ = /g' >> ./ios/release.xcconfig
  cat .env | grep "GOOGLE" | sed 's/=/ = /g' >> ./ios/localrelease.xcconfig
  cat .env | grep "GOOGLE" | sed 's/=/ = /g' >> ./ios/staging.xcconfig

  echo "✅ .xcconfig files created"

  source .env
  echo "✅ Android ENV vars exported"

else
  echo "⚠️ .env file missing!! ⚠️"
  echo "Please make sure the file exists and it's located in the root of the project"
fi

if [ -n "$RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK" ]; then
  eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK;
  echo "✅ executed ios prebuild hook"
fi

# Ignore any potential tracked changes to mutable development files.
git update-index --assume-unchanged "ios/Internals/ios/Internals.h"
git update-index --assume-unchanged "ios/Internals/ios/Internals.m"
git update-index --assume-unchanged "ios/Internals/ios/Internals.swift"
git update-index --assume-unchanged "ios/Internals/ios/Internals-Bridging-Header.h"
git update-index --assume-unchanged "ios/Extras.json"

# Specifying ONLY the node packages that we need to install via browserify
# (because those aren't available in react native) and some of our deps require them.
# If we don't specify which packages, rn-nodeify  will look into each package.json
# and install everything including a bunch devDeps that we don't need like "console"
rn-nodeify --install --hack 'crypto,buffer,react-native-randombytes,vm,stream,http,https,os,url,net,fs,process'
echo "✅ rn-nodeify packages hacked succesfully"

patch-package
echo "✅ All patches applied"

DEBUGFILE=src/config/debug.js
if test -f "$DEBUGFILE"; then
    echo "$DEBUGFILE exists."
else
    echo "$DEBUGFILE does not exist. You use default debug settings."
    cp src/config/defaultDebug.js $DEBUGFILE
fi

# Remove the incomplete installation
# of sentry-cli from node_modules
rm -rf node_modules/.bin/sentry-cli

if ! command -v sentry-cli &> /dev/null
then
  echo "Installing sentry-cli..."
  brew install getsentry/tools/sentry-cli
else
  which sentry-cli
  sentry-cli --version
  echo "sentry-cli is already installed. Skipping"
fi
