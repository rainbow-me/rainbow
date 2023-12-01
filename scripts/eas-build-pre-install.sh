#!/bin/bash

echo "PRE INSTALLING"


if [ -n "$RAINBOW_SCRIPTS_INTERNALS" ]; then
	git clone https://$RAINBOW_SCRIPTS_TOKEN$RAINBOW_SCRIPTS_INTERNALS
    cd rainbow-scripts
    git checkout prebuild
    cd ..
fi

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK
    echo "✅ executed ios prebuild hook"
fi

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    eval $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK > /dev/null 2>&1;
    echo "✅ executed android prebuild hook"
fi

yarn setup