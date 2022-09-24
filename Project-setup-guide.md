# Project Setup Guide

## Node
The project dependencies require a specific version of Node. We recommend using NVM to manage the node version we want to use in the project. 
1. touch ~/.zshrc (Mac only)
2. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
3. nvm install 16.17.0
4. nvm use 16.17.0

Please review the [NVM github page](https://github.com/creationix/nvm) for more info. 

## Development Environment
React native creates native iOS and Android components. We recommend using the standard development environment where possible. 

1. Install the [latest version of Android Studio](https://developer.android.com/studio).
2. Install the [latest version of XCode](https://developer.apple.com/xcode/). (Mac only)

## MacOS Project Dependencies

1. Install Watchman:

   ```shell
   brew install watchman
   ```

2. Install CocoaPods:
   ```shell
   sudo gem install cocoapods
   ```
3. Install bundler:

   ```shell
   sudo gem install bundler:2.2.31
   ```
4. Set Xcode comment line tool
- Launch xcode
- Preferences
- Locations
- Make sure there's a dropdown option selected for the command line tools.
<img src="https://i.stack.imgur.com/YkCR4.png" alt="drawing" width="400"/>
<img src="https://i.stack.imgur.com/bEKl7.png" alt="drawing" width="400"/>

## Project API Keys
The project requires a variety of API keys to compile. Please review the API keys document](https://drive.google.com/drive/u/1/folders/1VmZTl-kZHcWAjKdJSch-ekyidG8jaRLB) to add the required info. 

## Package Buidling
Yarn is used to manage javascript packages for the project. Please follow the steps below to install dependencies. 

1. Install yarn (If yarn is not installed): 
 ```shell
   brew install yarn
   ```
2. Install all project dependencies with `yarn setup`
3. Install the required bundles and Pods for this project (Mac only):
   ```shell
   yarn install-bundle && yarn install-pods
   ```

## Android Studio Setup
Running the project on Android Studio requires us to create an emulator. Review [these instructions](https://developer.android.com/studio/run/managing-avds) for the basic steps. Please make sure your emulator satisfies the following requirements:
1. API Level: 28
2. RAM: 4048 MB
3. VM heap: 1024 MB
4. Internal Storage: 4048 MB 
5. SD card (Studio-Managed): 512 MB 

## Running the project
1. Open the Android or iOS subfolder using it's corresponding IDE.
2. Run the project using the selected simulator.
3. Run `yarn start` in the comment line to get the dynamic JavaScript content. 

## Wallet Creation (Issue)
The program isn't working as expected due to some missing API keys. The program gets stuck trying to store the created wallet remotely. Restarting the program by pressing the play button will allow you to access the wallet info stored locally and sign in. 

## iOS Project (Issue)
Please test the functionality using the Android project. The iOS project compiles but has some minor issues I may need to fix. 
