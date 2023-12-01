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

echo "🌈 Running yarn setup..."
yarn setup

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    echo "🌈 Executing iOS prebuild.sh script"
    bash $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK;
    echo "✅ executed ios prebuild hook"
fi

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    bash $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK;

    echo "🌈 Downloading Google Services JSON"
    curl -H "Authorization: token $RAINBOW_SCRIPTS_TOKEN" -L $RAINBOW_GOOGLE_SERVICES_JSON -o android/app/google-services.json

    echo "🌈 apt-get libsecret-tools"
    sudo apt-get -y install libsecret-tools

    echo "✅ executed android prebuild hook"
fi

echo "🌈 Finished preinstallation..."
