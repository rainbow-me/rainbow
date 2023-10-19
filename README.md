![](https://pbs.twimg.com/profile_banners/1103191459409420288/1573207178/1500x500)

### 🌈️ Rainbow

> the Ethereum wallet that lives in your pocket!

📲️ [Available on the iOS App Store.](https://apps.apple.com/app/apple-store/id1457119021?pt=119997837&ct=github&mt=8)

🤖 [Android available on the Google Play Store](https://play.google.com/store/apps/details?id=me.rainbow&utm_campaign=gh&utm_source=referral&utm_medium=gh)

💻 [Browser extension available on](https://rainbow.me/download?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Chrome](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Brave](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Edge](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [FireFox](https://addons.mozilla.org/en-US/firefox/addon/rainbow-extension/?utm_campaign=gh&utm_source=referral&utm_medium=gh), and [Arc](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh).

🐦️ [Follow us on Twitter](https://twitter.com/rainbowdotme)

## Setup

### General

- Install NVM or Node.js 16: https://github.com/creationix/nvm
- Install all project dependencies with `yarn setup`

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

### Preflight

1. Run `nvm use` to force Node.js v16.

2. Set up your .env file, use our env.example as a guide.

   **_Note that some features are currently not accessible, we are working with our Data Providers in order to provide open source API Keys!_**

   Here are some resources to generate your own API keys:

   - Etherscan: https://etherscan.io/apis
   - Infura: https://infura.io/
   - ETH Gas Station: https://docs.ethgasstation.info/
   - Imgix: https://www.imgix.com/

3. Ensure a `google-services.json` has been added to the relevant project
   directory/directories so the compile will not fail.

   This can either be the live Google Services config (for internal development)
   or a self-provided config for a personal Firebase project (third-party
   contributors) registered under the package name `me.rainbow`.

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
