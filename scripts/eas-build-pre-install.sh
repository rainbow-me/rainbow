#!/bin/bash

echo "PRE INSTALLING"

mkdir -p ~/.ssh

# Real origin URL is lost during the packaging process, so if your
# submodules are defined using relative urls in .gitmodules then
# you need to restore it with:
#
# git remote set-url origin git@github.com:example/repo.git

# restore private key from env variable and generate public key
echo "$SSH_KEY_BASE64" | base64 -d > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

# add your git provider to the list of known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

if [ -n "$RAINBOW_SCRIPTS_INTERNALS" ]; then
	git clone $RAINBOW_SCRIPTS_INTERNALS
fi

if [ -n "$RAINBOW_INTERNALS" ]; then
    git clone $RAINBOW_INTERNALS
fi

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
    eval $RAINBOW_SCRIPTS_APP_IOS_PREBUILD_HOOK > /dev/null 2>&1;
    echo "✅ executed ios prebuild hook"
fi

if [ "$EAS_BUILD_PLATFORM" = "android" ]; then
    eval $RAINBOW_SCRIPTS_APP_ANDROID_PREBUILD_HOOK > /dev/null 2>&1;
    echo "✅ executed android prebuild hook"
fi

yarn setup