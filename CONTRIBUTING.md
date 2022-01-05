# How to Contribute

Rainbow is an open source project aimed to provide a easy to use, fast and secure way to send and receive Ethereum. If you are new to React Native, this is a helpful introduction:
https://reactnative.dev/docs/getting-started

Note: Read the whole guide before starting to contribute. There are important steps to follow, some of which are specific to the platform you are using.

## Environment Setup

### MacOS

_Note: Darwin versions of the application can only be developed/built on Darwin
platforms with XCode._

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

5. Start a React Native webserver with:

   ```shell
   yarn start
   ```

6. Open `rainbow-wallet/ios/Rainbow.xcworkspace` in XCode.

7. Run the project by clicking the play button.

### Linux

_Note: Linux development environments cannot develop or build Darwin versions of the
project._

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

4. Start a React Native webserver with:

   ```shell
   yarn start
   ```

5. Build/install/start the debug version of the app in an emulator with:
   ```shell
   yarn android
   ```

## Workflow and Pull Requests

_Before_ submitting a pull request, please make sure the following is done…

1.  Fork the repo and create your branch from `main`. A guide on how to fork a repository: https://help.github.com/articles/fork-a-repo/

    Open terminal (e.g. Terminal, iTerm, Git Bash or Git Shell) and type:

    ```sh-session
    $ git clone https://github.com/<your_username>/rainbow
    $ cd jest
    $ git checkout -b my_branch
    ```

    Note: Replace `<your_username>` with your GitHub username

2.  Rainbow uses [Yarn](https://yarnpkg.com/) for running development scripts. If you haven't already done so, please [install yarn](https://yarnpkg.com/en/docs/install).

    - Install all project dependencies with `yarn setup`

3.  Make sure you have a compatible version of `node` installed. Currently we support `node` version 14.

    Check the version of `node` by typing:

    ```sh
    node -v
    ```

    If the version is not compatible, please install a compatible version of `node`:

    - Install NVM or Node.js 14: https://github.com/creationix/nvm

4. Set up your .env file, use our env.example as a guide.

   **_Note that some features are currently not accessible, we are working with our Data Providers in order to provide open source API Keys!_**

   Here are some resources to generate your own API keys:

   - Etherscan: https://etherscan.io/apis
   - Infura: https://infura.io/
   - ETH Gas Station: https://docs.ethgasstation.info/
   - Imgix: https://www.imgix.com/

5. Ensure a `google-services.json` has been added to the relevant project
   directory/directories so the compile will not fail.

   This can either be the live Google Services config (for internal development)
   or a self-provided config for a personal Firebase project (third-party
   contributors) registered under the package name `me.rainbow`.

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

## Bugs

### Where to Find Known Issues

We will be using GitHub Issues for our public bugs. We will keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new issue, try to make sure your problem doesn't already exist.

### Reporting New Issues

The best way to get your bug fixed is to provide a detailed description of the issue and the steps to reproduce it.

## Code Conventions

- 2 spaces for indentation (no tabs).
- 80 character line length strongly preferred.
- Prefer `'` over `"`.
- ES6 syntax when possible.
- Use [TypeScript](https://www.typescriptlang.org/).
- Use semicolons;
- Trailing commas,
- Avd abbr wrds.
