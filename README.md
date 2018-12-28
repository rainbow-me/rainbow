# Balance Wallet

A mobile wallet for dapps &amp; tokens. Currently focused on iOS.

## Requirements

* A computer running macOS.
* Install the latest version of XCode: https://developer.apple.com/xcode/
* Clone and install Balance Common, our shared library: https://github.com/balance-io/balance-common

## How to run the project

If you are new to React Native, this is a helpful introduction: https://facebook.github.io/react-native/docs/getting-started.html

1. Clone the GitHub repository to your machine.

2. Run `nvm use` to use set version of node for this project

3. Run `yarn` to get all of the packages required.

4. Run `yarn nodeify`.

5. Install CocoaPods by running `sudo gem install cocoapods`.

6. Install required Pods by running `yarn install-pods`.

7. Run `yarn ios` to build the project for XCode.

8. Open `balance-wallet/ios/BalanceWallet.xcworkspace`.

9. Run the project by clicking the play button.

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
code-push release-react BalanceWallet-iOS ios -d <DEPLOYMENT>
```

The deployment can either be `Staging` or `Production` depending on the mode of the application you wish to update was built in through XCode.

### Local Builds

In order to build the application in "release" mode but not use the code push distribution you must build the application using the scheme `LocalRelease`.

Building the application with the `Staging` scheme or `Release` scheme will result in your bundle being replaced by the live code push deployment on resume of the application.
