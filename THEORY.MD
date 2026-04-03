# Theory: iOS ScrollView Teardown Crash

## Problem

The crash point groups repeated iOS production crashes in old-architecture React Native while the main thread is tearing down a scroll view. The failure is not in app Swift code despite Xcode grouping it at `UIApplicationDelegate.main()`. The real crash is an `EXC_BAD_ACCESS` inside `-[RCTUIManagerObserverCoordinator removeObserver:]`, called from `-[RCTScrollView dealloc]`. That makes this a teardown bug in the legacy `RCTScrollView` observer path rather than a general app-launch problem.

## Operating Theory

In React Native 0.79.5, `RCTUIManagerObserverCoordinator` stores observers in an `NSHashTable` created with `NSHashTableWeakMemory`. `RCTScrollView` registers itself as a UI manager observer only when `maintainVisibleContentPosition` is enabled. During deallocation, `RCTScrollView` calls `removeObserver:self`. The crash signature suggests `NSHashTable` is attempting to look up or message an object that is already partially torn down, which is consistent with removing a weakly-held object with default object personality during `dealloc`.

The app widens this native crash surface through `@legendapp/list`. That library defaults `maintainVisibleContentPosition` to `true` and maps it straight through to RN as `{ minIndexForVisible: 0 }`. So any `LegendList` call site that does not explicitly opt out silently becomes an observer-backed `RCTScrollView`, even if the screen does not need visible-position preservation.

## Strategy

The fastest low-risk mitigation is to stop opting into the RN observer path on screens that do not require it. This does not attempt to fix React Native internals or patch a third-party dependency globally. Instead it removes the app’s accidental reliance on `maintainVisibleContentPosition` where list content is static or append-only, which should prevent those screens from registering `RCTScrollView` as an observer at all.

That mitigation is now applied to the remaining `LegendList` screens that were still inheriting the default. Verification confirmed that every `LegendList` usage under `src/` now explicitly sets `maintainVisibleContentPosition={false}`, so the currently known app surfaces no longer rely on the observer-backed path.

If crashes continue after that mitigation, the next lever is deeper and native: either patch RN’s observer table to use pointer personality for weak entries or move off the affected old-architecture scroll path via RN upgrade or architecture change. That should only be necessary if there are additional observer-backed scroll views outside the currently identified `LegendList` surfaces.

## Key Discoveries

The first useful pivot was ignoring the crash point label. `PointInfo.json` names `AppDelegate.swift`, but every grouped incident symbolicates to `objc_msgSend -> RCTUIManagerObserverCoordinator removeObserver -> RCTScrollView dealloc`, so the app delegate is only the organizer bucket.

The second pivot was narrowing the RN trigger. `RCTScrollView` only adds itself to `observerCoordinator` when `maintainVisibleContentPosition` is non-nil. That converts the problem from “some random scroll view is deallocating” into “observer-backed scroll views are deallocating.”

The third pivot was recognizing the library default. The app has only a few direct `LegendList` usages, but `@legendapp/list` defaults `maintainVisibleContentPosition` to `true`. That means several screens were opting into the risky RN path implicitly rather than intentionally.

The fourth pivot was reconciling Sentry with Apple crash data. Sentry does have the same crash family grouped as `RAINBOW-WALLET-8NJ`, with culprit `-[RCTUIManagerObserverCoordinator removeObserver:]`, but its release distribution is dominated by older builds such as `me.rainbow@2.0.20+25` and currently does not surface `me.rainbow@2.0.22+13`. The Xcode/TestFlight crashpoint therefore appears to be ahead of what has actually been uploaded into Sentry for that release.

## Open Questions

The main uncertainty is whether every production incident comes from one of the current `LegendList` screens or whether there are additional old-architecture scroll views enabling `maintainVisibleContentPosition` through another abstraction. If the mitigation reduces but does not eliminate crashes, the remaining work is to inventory any other observer-backed scroll views and then decide whether an RN patch is warranted.

The other open question is why `2.0.22 (13)` is visible in Apple crash reporting but not yet in Sentry. The leading explanation is ingestion asymmetry rather than a different root cause: Apple receives TestFlight crashes directly, while Sentry only reflects crashes that were both captured locally and later uploaded. That should be treated as an inference until a concrete `2.0.22+13` Sentry event appears or internal crash-upload behavior is inspected more directly.
