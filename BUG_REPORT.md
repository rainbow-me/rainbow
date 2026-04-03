# Bug Report: iOS ScrollView Teardown Crash

## Summary

Rainbow is crashing on iOS during `RCTScrollView` teardown in old-architecture React Native. The crash occurs in the observer removal path:

- `objc_msgSend`
- `-[RCTUIManagerObserverCoordinator removeObserver:]`
- `-[RCTScrollView dealloc]`

Apple crash reporting shows this crash on `2.0.22 (13)`. Sentry has the same crash family grouped under a matching issue with culprit `-[RCTUIManagerObserverCoordinator removeObserver:]`, but currently surfaces it on older releases such as `me.rainbow@2.0.20+25` rather than `me.rainbow@2.0.22+13`.

## Apple Crash Evidence

Representative Apple crash report:

- Collected from Xcode Organizer crash reporting on April 2, 2026
- App version: `2.0.22 (13)`
- Device example: `iPhone12,1`

Relevant stack:

1. `objc_msgSend`
2. `-[RCTUIManagerObserverCoordinator removeObserver:]`
3. `-[RCTScrollView dealloc]`

Crash characteristics:

- Exception type: `EXC_BAD_ACCESS (SIGSEGV)`
- Subtype: `KERN_INVALID_ADDRESS`
- Thread: main thread
- App version: `2.0.22 (13)`
- OS example: `iPhone OS 26.2.1`

The same crashpoint groups multiple incidents with the same native path on older builds as well.

## React Native Root Cause Area

The relevant RN code is:

- [RCTScrollView.m](node_modules/react-native/React/Views/ScrollView/RCTScrollView.m)
- [RCTUIManagerObserverCoordinator.mm](node_modules/react-native/React/Modules/RCTUIManagerObserverCoordinator.mm)

What matters:

1. `RCTScrollView` unregisters itself from `observerCoordinator` during `dealloc`.
2. `RCTScrollView` only becomes a UI manager observer when `maintainVisibleContentPosition` is enabled.
3. `RCTUIManagerObserverCoordinator` stores observers in a weak `NSHashTable`.

This makes `maintainVisibleContentPosition` the key trigger surface. If a screen never enables that prop, its `RCTScrollView` should never register for this observer path.

## Why LegendList Matters

Rainbow uses `@legendapp/list` in several screens. That library defaults `maintainVisibleContentPosition` to `true` and forwards it into RN:

- [@legendapp/list index.js default](node_modules/@legendapp/list/index.js)
- [@legendapp/list index.js forwarding prop](node_modules/@legendapp/list/index.js)

That means a `LegendList` call site can opt into the risky RN observer path even if the screen never explicitly asked for prepend-position preservation.

## Sentry Investigation

Matching Sentry issue characteristics:

- Culprit: `-[RCTUIManagerObserverCoordinator removeObserver:]`
- Status: unresolved

Release distribution for the issue includes:

- `me.rainbow@2.0.20+25`
- `me.rainbow@2.0.21+43`
- many earlier releases

Current finding:

- I found no Sentry iOS crash events for `me.rainbow@2.0.22+13` on April 2, 2026.
- I did find the same crash family in Sentry on older releases.

Most likely explanation:

- Apple/TestFlight crash reporting is ahead of Sentry for this specific release.
- Apple receives the native crash directly.
- Sentry only reflects crashes that were captured locally and later uploaded.

This is an inference from the available evidence, not a proven ingestion bug.

## Mitigation Chosen

The current mitigation is to stop using `maintainVisibleContentPosition` on `LegendList` screens that do not need it.

Affected app files:

- [src/screens/Airdrops/AirdropsSheet.tsx](src/screens/Airdrops/AirdropsSheet.tsx)
- [src/components/king-of-the-hill/KingOfTheHillContent.tsx](src/components/king-of-the-hill/KingOfTheHillContent.tsx)
- [src/features/perps/screens/perps-trade-history/PerpsTradeHistoryScreen.tsx](src/features/perps/screens/perps-trade-history/PerpsTradeHistoryScreen.tsx)

Reason this mitigation is necessary:

- It removes the app from the RN observer-backed scrollview path that is crashing.
- It is explicit and low risk.
- It avoids patching third-party code while the failure is still being narrowed.

## Cleaner Long-Term Option

A cleaner app-level follow-up would be to wrap `@legendapp/list` behind a local `RainbowLegendList` component that defaults `maintainVisibleContentPosition={false}` and requires explicit opt-in where the behavior is genuinely needed.

That would preserve the same mitigation policy while avoiding repeated per-screen props.

## Open Questions

1. Are there any other app-level abstractions enabling `maintainVisibleContentPosition` outside current `LegendList` usage?
2. Is there a reliable way to prove why `2.0.22+13` appears in Apple crash reporting but not yet in Sentry?
3. If crashes continue after app-level opt-outs, should we patch RN locally or upgrade away from the affected old-architecture path?
