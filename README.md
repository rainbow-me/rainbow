# Balance Wallet

A mobile wallet for dapps &amp; tokens. Currently focused on iOS.

## Requirements

* A computer running macOS.
* Install the latest version of XCode: https://developer.apple.com/xcode/

## How to run the project

If you are new to React Native, this is a helpful introduction: https://facebook.github.io/react-native/docs/getting-started.html

1. Clone the GitHub repository to your machine.

2. Run `yarn` to get all of the packages required.

3. Run `./node_modules/.bin/rn-nodeify --install "crypto" --hack`

4. Install CocoaPods by running `sudo gem install cocoapods`

5. Install required Pods by running `cd ios && pod install && cd ..`

6. Run `yarn ios` to build the project for XCode.

7. Open `balance-wallet/ios/BalanceWallet.xcworkspace`.

8. Run the project by clicking the play button.
