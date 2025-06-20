## Maestro E2E Tests

### Run tests locally

#### iOS

1. Set `IS_TESTING=true` in your `.env` file.

2. Build and run the app in release mode: `yarn ios --mode Release`. It is also possible to run it in development mode to make debugging easier, but will diverge from what is ran on CI.

3. Run `./scripts/e2e-ios.sh` to run the full test suite. It is also possible to run a specific test by using the `--flow <path_to_file>` flag. For example to only run the import wallet test use `./scripts/e2e-ios.sh --flow ./e2e/auth/ImportWallet.yaml`.

#### Android

1. Set `IS_TESTING=true` in your `.env` file.

2. Build and run the app in release mode: `yarn android --extra-params "-PisE2E=true" --mode Release`. It is also possible to run it in development mode to make debugging easier, but will diverge from what is ran on CI.

3. Run `./scripts/e2e-android.sh` to run the full test suite. It is also possible to run a specific test by using the `--flow <path_to_file>` flag. For example to only run the import wallet test use `./scripts/e2e-android.sh --flow ./e2e/auth/ImportWallet.yaml`.

### Debug CI failures

Logs of the test run are saved in Github Actions artifacts. To access them go to the summary of the run (`https://github.com/rainbow-me/rainbow/actions/runs/<run_id>`) and scroll to the Artifacts section. There you can download the logs in the artifacts archive.

#### Android

The APK used to run the tests is also saved in the Artifacts section.

To get more debug output in CI, set `DEBUG=true` in `.github/workflows/android-e2e.yml`. This will also record logcat logs and a video of the test runs. Unfortunately the video is limited to 3 minutes, so it might not always be useful. Note that we've seen logcat cause adb to crash when running on CI so if this happens try disabling it (`scripts/e2e-android-ci.sh`).

### E2E test commands

To speedup getting the app into a specific state, we implement some commands. This is a deep link that we send to the app so it performs certain actions. The actions are implemented in `src/components/TestDeeplinkHandler.tsx`, and can be launched by using the following yaml.

```yaml
- openLink: rainbow://e2e/<command>?param1=value1&param2=value2
```

It is recommended that those commands are extracted to a flow for reuse. See `e2e/utils/ImportWalletWithKey.yaml` for an example.

### Troubleshooting

#### Cannot find view with a testID on iOS

On iOS `testID` is implemented using `accessibilityIdentifier`. If a parent view is marked as `accessible=true` then it is considered a leaf node and its children `accessibilityIdentifier` won't be visible. Try moving the `testID` up to the accessible view or making the view not accessible if it makes sense in that case. Note that `ButtonPressAnimation` defaults to `accessible=true`.

For example:

```tsx
<ButtonPressAnimation>
  <View testID="test" />
</ButtonPressAnimation>
```

Will not work, instead use:

```tsx
<ButtonPressAnimation testID="test">
  <View />
</ButtonPressAnimation>
```

#### Long wait time between actions

Maestro waits for the app to be settled before moving on to the next actions. If it seems to be waiting too much this is most likely caused by looping animations preventing it from settling. If you see any animation, you can use the `IS_TEST` from `@/env` to disable them for e2e tests only.

#### Flaky check

Flakiness will happen sometimes, it can be mitigated by having Maestro retry certain commands. See https://docs.maestro.dev/api-reference/commands/retry for more info.

```yaml
- retry:
    maxRetries: 3
    commands:
      # ... flaky commands
```
