![](https://pbs.twimg.com/profile_banners/1103191459409420288/1573207178/1500x500)
### 🌈️ Rainbow
> the Ethereum wallet that lives in your pocket!

📲️ [Available on the iOS App Store.](https://apps.apple.com/us/app/rainbow-ethereum-wallet/id1457119021)

🐦️ [Follow us on Twitter](https://twitter.com/rainbowdotme)

## Requirements

* A computer running macOS.
* NVM installed or Node.js 14: https://github.com/creationix/nvm
* Install CocoaPods by running `sudo gem install cocoapods`
* Install Watchman `brew install watchman`
* Install the latest version of XCode: https://developer.apple.com/xcode/

## How to run the project
If you are new to React Native, this is a helpful introduction:
https://facebook.github.io/react-native/docs/getting-started.html

### Preflight
1. Clone the GitHub repository to your machine.

2. Run `nvm use 14` to use set the version of node for this project.

3. Set up your .env file, use our env.example as a guide.

    ___Note that some features are currently not accessible, we are working with our Data Providers in order to provide open source API Keys!___

    Here are some resources to generate your own API keys:

    * Etherscan: https://etherscan.io/apis
    * Infura: https://infura.io/
    * ETH Gas Station: https://docs.ethgasstation.info/
    * Imgix: https://www.imgix.com/

4. Run `yarn setup` to get all of the packages required.

5. Ensure a `google-services.json` has been added to the relevant project
   directory/directories so the compile will not fail.
   
   This can either be the live Google Services config (for internal development)
   or a self-provided config for a personal Firebase project (third-party
   contributors) registered under the package name `me.rainbow`.

6. Start the React Native webserver with `yarn start`.

This will leave you with the React Native webserver running and listening for
file changes. Open a new terminal and start the app in an emulator using the
directions below.

### MacOS
Install the required bundle and Pods with:

```shell
yarn install-bundle && yarn install-pods
```

Then, open `rainbow-wallet/ios/Rainbow.xcworkspace` in XCode, and run the
project by clicking the play button.

### Linux
Non-Darwin development environments can only build/simulate the Android version
of the project, since XCode is required for iOS.

First, [install Android
Studio](https://developer.android.com/studio/install#linux), which comes with
the Android SDK, emulator, and all other system dependencies required for React
Native. Ensure at least one [AVD
image](https://developer.android.com/studio/run/managing-avds) is available for
the emulator.

Next, ensure you have the `secret-tool` and `watchman` commands available:

```shell
# Ubuntu/Debian
sudo apt install libsecret-tools watchman
```

Finally, build/install/launch the Android app in an emulator. Make sure you have
the `google-services.json` installed  as described above under **Preflight** or
the compile will fail.

```shell
yarn android
```

From now on, you will be able to simply run `yarn android` to start the emulator
after starting the React Native bundler with `yarn start`.

## CodePush

In order to use code push you must be logged into the correct Microsoft App Center account.

### Prerequisites
```
npm install -g code-push
code-push login
```

At this point you will be required to log into the account tied to the code push public keys in Info.plist

### Deployment
```
code-push release-react RainbowWallet-iOS ios -d <DEPLOYMENT>
```

The deployment can either be `Staging` or `Production` depending on the mode of the application you wish to update was built in through XCode.

### Local Builds

In order to build the application in "release" mode but not use the code push distribution you must build the application using the scheme `LocalRelease`.

Building the application with the `Staging` scheme or `Release` scheme will result in your bundle being replaced by the live code push deployment on resume of the application.
