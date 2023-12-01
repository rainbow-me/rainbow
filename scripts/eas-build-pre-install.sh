#!/bin/bash

echo "PRE INSTALLING"

if [ -n "$RAINBOW_SCRIPTS_INTERNALS" ]; then
    echo "🌈 Pulling latest rainbow-scripts code from github"
	git clone https://$RAINBOW_SCRIPTS_TOKEN$RAINBOW_SCRIPTS_INTERNALS
    cd rainbow-scripts
    git checkout prebuild
    cd ..
fi

echo "🌈 Creating .easignore"
bash $RAINBOW_SCRIPTS_APP_EASIGNORE_HOOK;

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    echo "🌈 Executing iOS prebuild.sh script"
    bash $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK;
    echo "✅ executed ios prebuild hook"
fi

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    echo "🌈 Executing Android prebuild.sh script"
    bash $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK;
    echo "✅ executed android prebuild hook"
fi


echo "🌈 Finished preinstallation..."
echo "🌈 Running yarn setup..."

yarn setup