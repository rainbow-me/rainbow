#!/bin/bash
set -eo pipefail

# Detect the platform.
PLATFORM=$(uname -s)

# Specify the required global NPM packages.
GLOBAL_NPM_SCRIPTS=( "patch-package" "rn-nodeify" )
GLOBAL_NPM_MISSING=()

# For each package, add it to the GLOBAL_NPM_MISSING array if it is not globally
# available using the canonical cross-platform method.
for script in ${GLOBAL_NPM_SCRIPTS[@]}
do
  if [ ! -x "$(command -v $script)" ]; then
    GLOBAL_NPM_MISSING+=($script)
  fi
done

# If there are missing global NPM packages, install them.
if [ ${#GLOBAL_NPM_MISSING[@]} -gt 0 ]
then
  echo ""
  echo "Some global NPM packages are required. Installing:"
  echo "${GLOBAL_NPM_MISSING[@]}"
  echo ""
  yarn global add ${GLOBAL_NPM_MISSING[@]}
fi

# Set up the environment.
if [ -e .env ]; then
  source .env

  function rewrite_xcode_configs {
    VALUE=$( cat .env | { grep "$1" || true; } )
    if [ -n "$VALUE" ]; then
      echo "$VALUE" | sed 's/=/ = /g' >> ./ios/debug.xcconfig
      echo "$VALUE" | sed 's/=/ = /g' >> ./ios/release.xcconfig
      echo "$VALUE" | sed 's/=/ = /g' >> ./ios/localrelease.xcconfig
      echo "$VALUE" | sed 's/=/ = /g' >> ./ios/staging.xcconfig
    else
      echo "$1 not found in .env";
      exit 1;
    fi
  }

  # For MacOS, copy xconfig files.
  if [ $PLATFORM == "Darwin" ]; then

    rewrite_xcode_configs "BRANCH"
    rewrite_xcode_configs "GOOGLE"
    rewrite_xcode_configs "CODE_PUSH_DEPLOYMENT_KEY_IOS"

    # Override Google Services API Key
    if [ -n "$GOOGLE_SERVICE_API_KEY" ]; then
      sed -i''-e "s/\$(GOOGLE_SERVICE_API_KEY)/$GOOGLE_SERVICE_API_KEY/" ./ios/Frameworks/GoogleService-Info.plist
      rm -rf 'ios/Frameworks/GoogleService-Info.plist-e'
    else
      echo "GOOGLE_SERVICE_API_KEY env variable is required";
      exit 1;
    fi

    echo "✅ .xcconfig files created"
  fi

  # Export Android env vars for all platforms.
  echo "✅ Android ENV vars exported"

else
  echo "⚠️ .env file missing!! ⚠️"
  echo "Please make sure the file exists and it's located in the root of the project"
fi

if [ -n "$RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK" ]; then
  if [ -n "$CI" ]; then
    eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK > /dev/null 2>&1;
  else
    eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK;
    echo "✅ executed ios prebuild hook"
  fi
fi

if [ -n "$RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK" ]; then
  if [ -n "$CI" ]; then
    eval $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK > /dev/null 2>&1;
  else
    eval $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK;
    echo "✅ executed android prebuild hook"
  fi
fi

# Ignore any potential tracked changes to mutable development files.
git update-index --assume-unchanged "ios/Frameworks/GoogleService-Info.plist"
git update-index --assume-unchanged "ios/Internals/ios/Internals.h"
git update-index --assume-unchanged "ios/Internals/ios/Internals.m"
git update-index --assume-unchanged "ios/Internals/ios/Internals.swift"
git update-index --assume-unchanged "ios/Internals/ios/Internals-Bridging-Header.h"
git update-index --assume-unchanged "ios/Extras.json"
git update-index --assume-unchanged "android/app/src/main/res/raw/extras.json"
git update-index --assume-unchanged "android/app/src/main/java/me/rainbow/NativeModules/Internals/InternalModule.java"
git update-index --assume-unchanged "android/app/src/main/java/me/rainbow/MainActivity.java"
git update-index --assume-unchanged "src/components/DappBrowser/DappBrowserWebview.tsx"


# Specifying ONLY the node packages that we need to install via browserify
# (because those aren't available in react native) and some of our deps require
# them. If we don't specify which packages, rn-nodeify  will look into each
# package.json and install everything including a bunch devDeps that we don't
# need like "console"
rn-nodeify --install --hack 'crypto,buffer,react-native-randombytes,vm,stream,http,https,os,url,net,fs,process'
echo "✅ rn-nodeify packages hacked succesfully"

# Apply patches.
patch-package
echo "✅ All patches applied"

# Create a debug file from the default if one does not exist.
DEBUGFILE=src/config/debug.ts

if test -f "$DEBUGFILE"; then
    echo "$DEBUGFILE exists."
else
    echo "$DEBUGFILE does not exist. You use default debug settings."
    cp src/config/defaultDebug.ts $DEBUGFILE
fi
