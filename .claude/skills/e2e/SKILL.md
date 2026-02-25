---
name: e2e
description: Use when the user explicitly asks to run e2e tests, set up e2e environment, create an e2e simulator, or debug Maestro flows. Do NOT activate proactively. Triggers: "run e2e", "e2e tests", "maestro test", "e2e simulator", "run flows".
---

# E2E Testing with Maestro

Run Maestro e2e tests locally against an isolated iOS simulator. Covers prerequisite installation, simulator lifecycle, building, and test execution.

> **IMPORTANT: Do NOT modify project config files** (`e2e/config.yaml`, `.env`, `Podfile`, `package.json`, etc.) unless the user explicitly asks you to. Your job is to install the correct iOS runtime and run tests against the existing configuration — not to "fix" or "modernize" configs.

## 1. Prerequisites

Check and install in order. Skip any tool already present.

```bash
# Xcode Command Line Tools
xcode-select -p || xcode-select --install

# iOS 18.5 Simulator Runtime (Maestro requires iOS 18.x — see note below)
xcrun simctl list runtimes | grep -q "iOS 18.5" || \
  xcodebuild -downloadPlatform iOS -buildVersion 18.5 -exportPath ~/SimRuntimes

# Maestro CLI (e2e test runner)
which maestro || brew install mobile-dev-inc/tap/maestro
```

## 2. Simulator Management

Maintain a dedicated **"Rainbow E2E"** simulator, isolated from daily-use simulators. **Must use the iOS 18.5 runtime** — Maestro does not work with iOS 19+.

**By default, run the simulator headless** (no Simulator.app window). Only open the Simulator UI if the user explicitly asks to watch/see the test progress.

### Create or reset

```bash
# Check if Rainbow E2E already exists AND is available (not "unavailable")
xcrun simctl list devices | grep "Rainbow E2E"

# If it shows "unavailable, runtime profile not found" — the runtime is gone, delete it:
xcrun simctl delete <UDID>

# Create fresh (must use iOS 18.5 runtime)
xcrun simctl create "Rainbow E2E" "iPhone 16 Pro" com.apple.CoreSimulator.SimRuntime.iOS-18-5

# Boot headless
xcrun simctl boot <UDID>

# Only if user wants to watch — open Simulator.app
open -a Simulator
```

### When to erase vs rely on Maestro

Maestro flows already use `launchApp: clearState: true, clearKeychain: true` for app-level cleanup. Use `xcrun simctl erase` only for deeper resets (corrupted keychain, stale system state, fresh start).

### Cleanup

Only when the user asks:

```bash
xcrun simctl shutdown <UDID> && xcrun simctl delete <UDID>
```

## 3. Environment Setup

Ensure `.env` has both flags enabled before building:

```
IS_TESTING=true
ENABLE_DEV_MODE=1
```

These control `IS_TEST` and `IS_DEV` in `src/env.ts`. The `TestDeeplinkHandler` component only mounts when `IS_TEST` is true.

## 4. Build

**Always build in Release mode** (matches CI). Run `yarn ios` **in the background** (pass `run_in_background: true` to the Bash tool) — it blocks for several minutes and doesn't need monitoring. Wait for the background task completion notification before proceeding.

```bash
yarn ios --mode Release --simulator='Rainbow E2E'
```

Do **not** capture build output to a file and tail it. Just wait for the background task notification.

## 4a. Simulator Logs

Stream logs from the simulator for debugging:

```bash
xcrun simctl spawn <UDID> log stream --predicate 'subsystem == "me.rainbow"' --level debug
```

## 5. Running Tests

Get the UDID once and reuse:

```bash
UDID=$(xcrun simctl list devices | grep "Rainbow E2E" | grep -v "unavailable" | grep -oE '[0-9A-F-]{36}')
```

Suppress JVM warnings when running maestro directly:

```bash
export JDK_JAVA_OPTIONS="--enable-native-access=ALL-UNNAMED"
```

### Full suite (via e2e-run.sh)

```bash
./scripts/e2e-run.sh --platform ios --udid $UDID
```

### Single flow (via e2e-run.sh)

```bash
./scripts/e2e-run.sh --platform ios --udid $UDID --flow e2e/flows/<category>/<Flow>.yaml
```

### Single flow (direct maestro)

**Run in the background** (pass `run_in_background: true` to the Bash tool). Maestro's progress output doesn't stream well through the Bash tool — running foreground will appear to hang and may cause duplicate runs. Wait for the background completion notification, then read the output file.

```bash
export JDK_JAVA_OPTIONS="--enable-native-access=ALL-UNNAMED"
source .env
maestro --udid $UDID test \
  --config e2e/config.yaml \
  -e DEV_PKEY="$DEV_PKEY" \
  -e APP_ID="me.rainbow" \
  e2e/flows/<category>/<Flow>.yaml
```

If only one simulator is booted, `--udid $UDID` can be omitted.

### Artifacts and screenshots

After any run, Maestro saves artifacts to `~/.maestro/tests/<yyyy-MM-dd_HHmmss>/`. Screenshots are named with emoji prefixes:

- `screenshot-⚠️-*.png` — warning (optional element not found, etc.)
- `screenshot-❌-*.png` — failure (assertion or timeout)

**Do not auto-open screenshots.** Instead, list them at the end of the run and let the user request to open specific ones:

```bash
# List artifacts from latest run
MAESTRO_OUT=$(ls -dt ~/.maestro/tests/*/ | head -1)
echo "Artifacts: $MAESTRO_OUT"
ls "$MAESTRO_OUT"/*.png 2>/dev/null | sed 's|.*/||'
```

Only `open` a screenshot if the user explicitly asks to see it.

### iOS version & `accessibilityViewIsModal` caveat

CI uses Xcode 16.4 (iOS 18.x SDK) with an iOS 18.5 simulator — this combination works without issues. Locally with Xcode 26.3+, the iOS SDK sets `accessibilityViewIsModal` on certain views, which causes Maestro's accessibility snapshot to hide elements behind modals. This makes testIDs invisible.

The fix is adding `snapshotKeyHonorModalViews: false` under `platform.ios` in `e2e/config.yaml`. It's safe for CI too since that filtering was never needed for these tests.

### Notes

- Transaction flows (`e2e/flows/transactions/`) auto-start Anvil via `scripts/anvil.sh`
- `CancelSwapTransaction` and `SpeedUpSwapTransaction` are tagged `sequential` (exclusive Anvil mining control)
- All other flows are tagged `parallel` and can run concurrently

## 6. Flow Catalog

### Onboarding

| Flow                 | Run Command                                           | Key Files                                              | Description                                                                                  |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `CreateWallet`       | `--flow e2e/flows/onboarding/CreateWallet.yaml`       | `WelcomeScreen.tsx`, `WalletCreationFlow.tsx`          | Create new wallet from welcome screen, validate home screen loads with action buttons        |
| `SecretPhraseWallet` | `--flow e2e/flows/onboarding/SecretPhraseWallet.yaml` | `ImportSeedPhraseSheet.tsx`, `TestDeeplinkHandler.tsx` | Import wallet via 12-word secret phrase deep link, validate balance display and receive card |
| `WatchedWallet`      | `--flow e2e/flows/onboarding/WatchedWallet.yaml`      | `ImportSeedPhraseSheet.tsx`, `WatchedWalletSheet.tsx`  | Import watch-only wallet via ENS address, validate address display and copy button           |

### Transactions

| Flow                     | Run Command                                                 | Key Files                                           | Description                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SwapTransaction`        | `--flow e2e/flows/transactions/SwapTransaction.yaml`        | `src/__swaps__/`, `SwapReviewSheet.tsx`             | Swap ETH to DAI on Anvil. Tests degen mode toggle, review panel labels, gas speed selector (Custom/Normal/Fast/Urgent)                                                 |
| `WrapTransaction`        | `--flow e2e/flows/transactions/WrapTransaction.yaml`        | `src/__swaps__/`, `SwapReviewSheet.tsx`             | Wrap ETH to WETH and unwrap. Tests flip button, slippage increment/decrement, preferred network selector, home balance updates                                         |
| `SendTransaction`        | `--flow e2e/flows/transactions/SendTransaction.yaml`        | `SendSheet.tsx`, `src/components/send/`             | Send 0.01 ETH to rainbowwallet.eth. Tests ENS resolution, send sheet, review, hold-to-send, toast notifications (Android)                                              |
| `SendNft`                | `--flow e2e/flows/transactions/SendNft.yaml`                | `SendSheet.tsx`, `src/state/nfts/`                  | Send Rainbow Pooly NFT. Tests NFT selection from collection, send review, toast with NFT name (Android)                                                                |
| `CancelSwapTransaction`  | `--flow e2e/flows/transactions/CancelSwapTransaction.yaml`  | `SpeedUpAndCancelSheet.tsx`, `pendingTransactions/` | Swap with paused automine, cancel pending tx via activity context menu. Verifies SpeedUpAndCancelSheet loads. **Sequential** (exclusive Anvil)                         |
| `SpeedUpSwapTransaction` | `--flow e2e/flows/transactions/SpeedUpSwapTransaction.yaml` | `SpeedUpAndCancelSheet.tsx`, `pendingTransactions/` | Swap with paused automine, speed up pending tx via activity context menu. Verifies SpeedUpAndCancelSheet confirm button. **Sequential** (exclusive Anvil)              |
| `DelegationTransaction`  | `--flow e2e/flows/transactions/DelegationTransaction.yaml`  | `src/screens/delegation/`, `pendingTransactions/`   | EIP-7702 delegation display. Tests: delegated swap has no speed-up/cancel, delegate tx shows "Delegating" + "Smart Account", revoke shows "Revoking" + "Smart Account" |
| `EditContact`            | `--flow e2e/flows/transactions/EditContact.yaml`            | `SendSheet.tsx`, `src/components/send/`             | Add, rename, and delete a contact during send flow to rainbowwallet.eth                                                                                                |

### Settings

| Flow                 | Run Command                                         | Key Files                                  | Description                                                                     |
| -------------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `Settings`           | `--flow e2e/flows/settings/Settings.yaml`           | `src/screens/SettingsSheet/`               | Change currency to EUR, switch to dark theme, navigate to diagnostics           |
| `ManualBackup`       | `--flow e2e/flows/settings/ManualBackup.yaml`       | `src/components/backup/`, `SettingsSheet/` | Navigate to backup section, show seed phrase, mark wallet as manually backed up |
| `AndroidCloudBackup` | `--flow e2e/flows/settings/AndroidCloudBackup.yaml` | `src/components/backup/`                   | Android Google Drive backup flow with Google sign-in (Android-only)             |

### Screens

| Flow                              | Run Command                                                     | Key Files                                        | Description                                                                                                            |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `Home`                            | `--flow e2e/flows/screens/Home.yaml`                            | `RecyclerAssetList2/`, `HomeScreen.tsx`          | Validate home screen: avatar, action buttons, tab bar navigation (discover, browser, activity, points), profile screen |
| `Discover`                        | `--flow e2e/flows/screens/Discover.yaml`                        | `DiscoverScreen.tsx`, `src/components/Discover/` | Token search for ETH/DAI, chart header display, favorites and verified sections, search clear                          |
| `MaliciousDappTransactionWarning` | `--flow e2e/flows/screens/MaliciousDappTransactionWarning.yaml` | `src/components/DappBrowser/`                    | Validate malicious dapp warning during transaction signing in DApp browser                                             |

### DApp Connections

| Flow            | Run Command                                            | Key Files                     | Description                                                                        |
| --------------- | ------------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------- |
| `WalletConnect` | `--flow e2e/flows/dapp-connections/WalletConnect.yaml` | `src/components/DappBrowser/` | WalletConnect session via DApp browser, connection management, transaction signing |

## 7. Deep Link Commands

Implemented in `src/components/TestDeeplinkHandler.tsx`. Used by flows for fast state setup.

| Command             | Example                                                               | Purpose                                           |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `import`            | `rainbow://e2e/import?privateKey=<key>&name=<name>`                   | Import wallet via private key or seed phrase      |
| `connect-anvil`     | `rainbow://e2e/connect-anvil`                                         | Toggle Anvil test network connection              |
| `fund-wallet`       | `rainbow://e2e/fund-wallet?amount=20`                                 | Send ETH from Anvil faucet account to test wallet |
| `inject-pending-tx` | `rainbow://e2e/inject-pending-tx?type=swap&delegation=true&nonce=999` | Inject synthetic pending transaction              |

Transaction types for `inject-pending-tx`: `send`, `swap`, `delegate`, `revoke_delegation`, `wrap`, `unwrap`.
