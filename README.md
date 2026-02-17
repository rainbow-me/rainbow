![](https://pbs.twimg.com/profile_banners/1103191459409420288/1573207178/1500x500)

### 🌈️ Rainbow

> the Ethereum wallet that lives in your pocket!

📲️ [Available on the iOS App Store.](https://apps.apple.com/app/apple-store/id1457119021?pt=119997837&ct=github&mt=8)

🤖 [Android available on the Google Play Store](https://play.google.com/store/apps/details?id=me.rainbow&utm_campaign=gh&utm_source=referral&utm_medium=gh)

💻 [Browser extension available on](https://rainbow.me/download?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Chrome](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Brave](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Edge](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [FireFox](https://addons.mozilla.org/en-US/firefox/addon/rainbow-extension/?utm_campaign=gh&utm_source=referral&utm_medium=gh), and [Arc](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh).

𝕏 [Follow us on X](https://x.com/rainbowdotme)

## Setup

> [!TIP] > **Internal developers** can also use the [`rainbow-me/rainbow-setup`](https://github.com/rainbow-me/rainbow-setup)
> script to install all dependencies and configure the project in one step.

### Prerequisites

1. Install nvm: https://github.com/creationix/nvm
2. Install the required Node.js version: `nvm install`
3. Install Ruby (version specified in `.ruby-version`). macOS system Ruby is
   too old and will not work. Use a version manager such as
   [rbenv](https://github.com/rbenv/rbenv) or [rvm](https://rvm.io/).
4. Enable yarn: `corepack enable`

**Note:** On future terminal sessions, run `nvm use` to activate the correct
Node.js version. Alternatively, set up
[automatic nvm switching](https://github.com/nvm-sh/nvm#deeper-shell-integration)
in your shell.

### Internal developers

Set up these **before** running `yarn install`, as the postinstall script reads
`.env` and `rainbow-scripts` to generate build configs and run prebuild hooks.

1. Copy `dotenv` from [`rainbow-me/rainbow-env`](https://github.com/rainbow-me/rainbow-env)
   to `.env` in the project root.
2. Copy `android/app/google-services.json` from the same repo to `android/app/`
   in this project.
3. Clone [`rainbow-me/rainbow-scripts`](https://github.com/rainbow-me/rainbow-scripts)
   into the project root (the postinstall prebuild hooks depend on it).
4. Install dependencies and run setup: `yarn install && yarn setup`

### External contributors

1. Copy `.env.example` to `.env` and fill in your own API keys. Note that some
   features are currently not accessible; we are working with our Data
   Providers to provide open source API Keys.
   - Etherscan: https://etherscan.io/apis
   - Infura: https://infura.io/
   - ETH Gas Station: https://docs.ethgasstation.info/
   - Imgix: https://www.imgix.com/
2. Provide your own `google-services.json` in `android/app/` from a personal
   Firebase project registered under the package name `me.rainbow`.
3. Install dependencies and run setup: `yarn install && yarn setup`

The iOS `GoogleService-Info.plist` is already in the repo and gets its API key
patched by the postinstall script from `GOOGLE_SERVICE_API_KEY` in your `.env`.

### iOS (macOS only)

1. Install Xcode from the Mac App Store.
2. Install Watchman: `brew install watchman`
3. Install the required bundles and Pods:
   ```
   yarn install-bundle && yarn install-pods
   ```

### Android

1. Install JDK 17. Do **not** use the JDK bundled with Android Studio (it's
   JDK 21, which [causes build
   failures](https://reactnative.dev/docs/set-up-your-environment)). On macOS:
   ```sh
   brew install --cask zulu@17
   ```
2. Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```sh
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   # export ANDROID_HOME=$HOME/Android/Sdk        # Linux
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
On Linux, also install system dependencies: `sudo apt install libsecret-tools watchman`

3. Install [Android Studio](https://developer.android.com/studio) (the standard
   setup wizard is fine).
4. Increase the IDE memory: **Android Studio > Settings > Memory Settings** and
   set the heap to at least 4096 MB. This project is large enough that the
   default 2048 MB will cause slow syncs and builds.
5. Set the Gradle JDK: **Settings > Build, Execution, Deployment > Build
   Tools > Gradle > Gradle JDK** and select the `JAVA_HOME` (Azul Zulu 17)
   entry. The default points to the bundled JDK 21.
6. Restart any open terminals so the new environment variables take effect.
7. Create an emulator via Android Studio > Device Manager (unless using a physical device).
8. Run the first build from the terminal to generate native headers that
   Android Studio needs for Gradle sync:
   ```
   cd android && ./gradlew assembleDebug && cd ..
   ```
9. Quit Android Studio completely, then reopen it from the terminal so Gradle
   sync picks up the generated headers:
    ```
    open -a "Android Studio"  # macOS
    ```
    Always launch Android Studio this way so it inherits your shell PATH
    (including `node` from nvm). Launching from Spotlight or the Dock will
    cause Gradle sync to fail with "Cannot run program node".

## Developing

Start Metro in one terminal:

```
yarn start
```

Then build and run:

- **iOS:** Open `ios/Rainbow.xcworkspace` in Xcode (not the `.xcodeproj`) and
  press Cmd+R, or run `yarn ios` from the terminal.
- **Android:** Open the `android/` folder in Android Studio, or run
  `yarn android` from the terminal.
