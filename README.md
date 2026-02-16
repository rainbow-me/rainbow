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
3. Enable yarn: `corepack enable`

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

### MacOS

1. Install the [latest version of XCode](https://developer.apple.com/xcode/).

2. Install Watchman:

   ```shell
   brew install watchman
   ```

3. Install CocoaPods:

   ```shell
   sudo gem install cocoapods
   ```

4. Install the required bundles and Pods for this project:
   ```shell
   yarn install-bundle && yarn install-pods
   ```

### Linux

1. Install system dependencies:

   ```shell
   sudo apt install libsecret-tools watchman
   ```

2. Follow the [React Native environment setup
   instructions](https://reactnative.dev/docs/environment-setup) carefully,
   which will involve installing Android Studio, the Android SDK, the emulator,
   etc. and making them available in your `$PATH`.

3. Ensure at least one [AVD
   image](https://developer.android.com/studio/run/managing-avds) is available
   for the emulator (unless using a physical device).

## Developing

If you are new to React Native, this is a helpful introduction:
https://reactnative.dev/docs/getting-started

### MacOS

_Note: Darwin versions of the application can only be developed/built on Darwin
platforms with XCode._

1. Start a React Native webserver with:

   ```shell
   yarn start
   ```

2. Open `rainbow-wallet/ios/Rainbow.xcworkspace` in XCode.

3. Run the project by clicking the play button.

### Linux

_Note: Linux development environments cannot develop or build Darwin versions of the
project._

1. Start a React Native webserver with:

   ```shell
   yarn start
   ```

2. Build/install/start the debug version of the app in an emulator with:
   ```shell
   yarn android
   ```
