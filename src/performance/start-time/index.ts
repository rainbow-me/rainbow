// React Native exposes `performance.rnStartupTiming` (an instance of
// `ReactNativeStartupTiming`) on the global `performance` object. The shape lives in
// `react-native/src/private/webapis/performance/ReactNativeStartupTiming.js` and isn't
// re-exported through public types, so we declare just the field we read.
//
// `startTime` is populated by the host app firing `APP_STARTUP_START` from native code
// (Android: `ReactMarker.logMarker(APP_STARTUP_START)` in `MainApplication.onCreate`;
// iOS: `RCTPerformanceLogger().markStart(for: .appStartup)` in `AppDelegate`).
// Without that wiring it falls back to RN runtime init time, which misses the Activity /
// JNI / cold-start window.
type RNPerformance = Performance & {
  rnStartupTiming?: {
    startTime?: number;
  };
};

const startTime = (performance as RNPerformance).rnStartupTiming?.startTime;

export const APP_START_TIME = typeof startTime === 'number' ? startTime : performance.now();
