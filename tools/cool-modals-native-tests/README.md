# Cool-modals native checks

Run on an explicitly selected, booted simulator:

```sh
python3 tools/cool-modals-native-tests/run.py \
  --artifacts /tmp/cool-modals-native-tests \
  --panmodal /path/to/PanModal \
  --device YOUR_SIMULATOR_UDID
```

The PanModal checkout must match the commit selected by `ios/Podfile`. The runner
compiles the actual screen and adapter with UIKit, syntax-checks the actual native
stack against the generated Swift header, and installs a small diagnostic app.
Builds, source snapshots, callback traces, and results stay under `--artifacts`.
A failed candidate assertion exits nonzero.

Add `--baseline REVISION` to run the shorter containment contract against a prior
revision. Baseline mode requires a containment failure with setup and control checks
passing; it records each assertion and does not count those failures as candidate
acceptance.

The React bridge and stack notification boundary are recording substitutes. This
suite covers native containment, sizing, callback order, cancellation, reuse, and
invalidation. It does not exercise React Native Paper reconciliation, native-stack
policy, JS delivery of dismissal events, real touch input, or physical frame
cadence. It preserves the production PanModal source and motion law.
