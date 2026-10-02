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

1. Install [mise](https://mise.jdx.dev): `curl https://mise.run | sh`. See the
   [installation docs](https://mise.jdx.dev/getting-started.html) for shell
   activation (required so tool versions auto-switch when you `cd` into the repo).
2. From the repo root: `mise install`. This installs all pinned tools. Use Node
   22.18+ in the pinned 22.x line (or 23.6+); Metro and native fingerprinting use built-in TypeScript support.
3. Enable yarn: `corepack enable`

### Internal developers

Set up these **before** running `yarn install`, as the postinstall script reads
`.env` and `rainbow-scripts` to generate build configs and run prebuild hooks.

1. Authenticate the [GitHub CLI](https://cli.github.com/) (`gh auth login`), or
   export a `GITHUB_TOKEN` with access to our private repos.
2. Run `yarn update-env` to install `.env` (overwrites any existing local `.env`).
3. Clone [`rainbow-me/rainbow-scripts`](https://github.com/rainbow-me/rainbow-scripts)
   into the project root (the postinstall prebuild hooks depend on it).
4. Install dependencies and run setup: `yarn install && yarn setup`.

### External contributors

1. Copy `.env.example` to `.env` and fill in your own API keys. Note that some
   features are currently not accessible; we are working with our Data
   Providers to provide open source API Keys.
   - Etherscan: https://etherscan.io/apis
   - Infura: https://infura.io/
   - ETH Gas Station: https://docs.ethgasstation.info/
   - Imgix: https://www.imgix.com/
2. Provide your own `google-services.json` in `android/app/` from a personal
   Firebase project registered under the package name `me.rainbow`. For Google
   Drive backup/restore to work in your builds, also register your signing
   keystore's SHA-1 fingerprint as an Android OAuth client in that project's
   Google Cloud console.
3. Install dependencies and run setup: `yarn install && yarn setup`

The iOS `GoogleService-Info.plist` is already in the repo and gets its API key
patched by the postinstall script from `GOOGLE_SERVICE_API_KEY` in your `.env`.

### iOS (macOS only)

1. Install the Xcode version pinned in [`.xcode-version`](./.xcode-version).
   Recommended: use the [`xcodes`](https://github.com/XcodesOrg/xcodes) CLI,
   which reads `.xcode-version` automatically:
   ```sh
   brew install xcodesorg/made/xcodes
   xcodes install
   ```
   Alternatively, download the pinned version from
   [developer.apple.com/download](https://developer.apple.com/download/all/).
   CI and Bitrise build against the same pin, so local parity matters.
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
   export PATH=$ANDROID_HOME/cmdline-tools/19.0/bin:$PATH
   ```

   On Linux, also install system dependencies: `sudo apt install libsecret-tools watchman`

3. Install [Android Studio](https://developer.android.com/studio), including
   **Android SDK Command-line Tools 19.0** in SDK Manager (enable **Show Package
   Details** to select the version). This version is validated with JDK 17. Confirm
   `avdmanager list device -c` works with JDK 17. The old `tools/bin` package is
   incompatible with JDK 17.
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
   (including `node` from mise). Launching from Spotlight or the Dock will
   cause Gradle sync to fail with "Cannot run program node".

## Developing

### Isolated devices with Stim

After completing Setup in this checkout, use the pinned CLI:

```sh
yarn stim ios --scheme Rainbow --configuration Debug
yarn stim android --variant debug
yarn stim status --json
yarn stim logs --errors
yarn stim stop
```

Stim assigns each checkout a device and Metro port. Debug runs start Metro
automatically. Use ordinary Fast Refresh for source edits. After environment,
Babel or Metro configuration changes, stop and run each desired platform again.
Read the current port from the result; stopping releases the old reservation.

To prepare a new linked worktree from an already prepared source checkout, run
`/path/to/source/node_modules/.bin/stim worktree warm` inside the new worktree.
Warming copies missing dependencies, Pods and local configuration,
including `.env`, into independently writable files. It preserves existing
target files and excludes the scratch/build paths in `.worktreeexclude`.

Stim reads that policy from the source checkout. Reinstall dependencies when
package, lockfile or patch inputs differ; rerun Pods when Podfile inputs differ,
and regenerate native configuration when its environment inputs differ. Follow
any mismatch reported by Stim. Use Setup when the source is not prepared.
Never symlink `node_modules` between worktrees. The Android keystore directory is excluded.

Before an agent's first native run, inspect `yarn stim status --json` and
`yarn stim settings --json`. Use the checkout's owned simulator/emulator with
local builds and tunneling off. Ask before replacing an existing assignment or
using a physical/remote device. Stop only the checkout being worked on.

Do not use `start --reset-cache` for ordinary restarts: it also clears shared
Rainbow transforms. Stim is for local development; release/signing and the
existing fixed-port E2E runners retain their existing commands.

### Direct React Native commands

Start Metro in one terminal:

```
yarn start
```

Then build and run:

- **iOS:** Open `ios/Rainbow.xcworkspace` in Xcode (not the `.xcodeproj`) and
  press Cmd+R, or run `yarn ios` from the terminal.
- **Android:** Open the `android/` folder in Android Studio, or run
  `yarn android` from the terminal.
