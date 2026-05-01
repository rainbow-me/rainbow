import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { IS_DEV, IS_TEST, IS_TEST_FLIGHT } from '@/env';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger, RainbowError } from '@/logger';

// Bumped whenever the source of perf data changes (lib → in-house → Sentry).
// Lets Amplitude queries split old vs new data series on app upgrades.
const PERFORMANCE_TRACKING_VERSION = 4;

/**
 * React Navigation integration. Drives Sentry's app-start + TTID tracking:
 * - app-start cold/warm comes from native hooks once `enableAutoPerformanceTracing` is on.
 * - TTID per screen needs the navigation ref registered via `registerNavigationContainer`,
 *   wired from the `NavigationContainer.onReady` callback.
 */
export const sentryNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

/**
 * Emits Sentry's app-start as a standalone `app.start.cold` / `app.start.warm`
 * transaction (instead of attaching it as a child span to the first navigation
 * transaction). The standalone form is what we forward to Amplitude in
 * `beforeSendTransaction` below.
 */
const sentryAppStartIntegration = Sentry.appStartIntegration({ standalone: true });

/**
 * Re-emits Sentry's standalone app-start transaction as our existing
 * `performance.report` Amplitude event so the wallet's analytics dashboard
 * keeps receiving startup TTI data without us running our own timer module.
 *
 * - `durationInMs` = total app-start duration (from process start to RN ready).
 * - `segments`     = each native span (Pre Runtime Init, Runtime Init, Bundle Eval, …)
 *                    flattened to a `name → duration_ms` map.
 * - `data.startType` = 'cold' | 'warm' | 'unknown'.
 *
 * Returning the event unchanged keeps it flowing to Sentry too. Returning null
 * would suppress it from Sentry; we want both pipelines.
 */
function forwardAppStartToAmplitude(transaction: Sentry.TransactionEvent): void {
  const name = transaction.transaction;
  if (!name?.startsWith('app.start.')) return;

  const startType = name === 'app.start.cold' ? 'cold' : name === 'app.start.warm' ? 'warm' : 'unknown';
  const measurementKey = startType === 'cold' ? 'app_start_cold' : startType === 'warm' ? 'app_start_warm' : null;
  const totalDurationMs = (measurementKey && transaction.measurements?.[measurementKey]?.value) ?? 0;
  if (!totalDurationMs) return;

  const segments: Record<string, number> = {};
  for (const span of transaction.spans ?? []) {
    if (typeof span.start_timestamp === 'number' && typeof span.timestamp === 'number') {
      segments[span.description ?? span.op ?? 'unknown'] = (span.timestamp - span.start_timestamp) * 1000;
    }
  }

  analytics.track(event.performanceReport, {
    reportName: 'app_startup',
    durationInMs: totalDurationMs,
    segments,
    performanceTrackingVersion: PERFORMANCE_TRACKING_VERSION,
    data: { startType },
  });
}

// Sentry tests each regex against these candidate strings:
//   1. event.message
//   2. lastException.value (e.g. "Aborted")
//   3. "lastException.type: lastException.value" (e.g. "AbortError: Aborted")
// A match on ANY candidate drops the event.
const IGNORED_ERRORS: Array<string | RegExp> = [
  // "AbortError: Aborted"
  // Thrown by whatwg-fetch when a request is intentionally cancelled via AbortController. This is expected behavior
  // (e.g. createQueryStore aborting stale fetches on param change).
  // Matches candidate 3 ("AbortError: Aborted"). Anchored to the type prefix to avoid false positives.
  /^AbortError:/,

  // "TypeError: Network request failed"
  // Thrown by whatwg-fetch when the device has no network connectivity (offline, tunnel, flaky wifi). Not actionable
  // client-side.
  // Matches candidate 2 ("Network request failed"). Exact match to avoid catching other TypeErrors.
  /^Network request failed$/,
];

export const defaultOptions: Sentry.ReactNativeOptions = {
  attachStacktrace: true,

  beforeSend(event, hint) {
    // Drop non-actionable fetch errors (5xx, network failures).
    const error = hint?.originalException;
    if (error instanceof RainbowError && error.cause instanceof RainbowFetchError) {
      const { response } = error.cause;
      if (!response) return null; // Network failure (no connectivity, timeout, etc.)
      if (response.status >= 500) return null;
    }

    // Check if this is a captureMessage call.
    //
    // captureMessage events (logger.warn, logger.log) have event.message
    // but no event.exception. captureException events (logger.error) always
    // have event.exception, so this guard skips them.
    if (event.message && !event.exception) {
      // Without this, attachStacktrace adds a synthetic stack that Sentry
      // groups on instead of the message. Since all messages route through
      // sentryTransport, the stacks are nearly identical, and minor platform
      // differences (Hermes function names, bundle filenames) split iOS and
      // Android into separate issues.
      //
      // Grouping by message is the correct semantic for warnings/logs since
      // the message describes what happened. In practice messages are
      // naturally unique per call site (most use context prefixes like
      // "[Positions] ..."). The stack trace is still preserved on each
      // event for debugging, it just no longer drives the grouping.
      event.fingerprint = [event.message];
    }
    return event;
  },

  beforeSendTransaction(transaction) {
    forwardAppStartToAmplitude(transaction);
    return transaction;
  },

  dsn: SENTRY_ENDPOINT,
  enableAppHangTracking: false,
  // Auto perf tracing enables native app-start (cold/warm), native frames tracking,
  // and the React Navigation transaction lifecycle the integration above hooks into.
  enableAutoPerformanceTracing: true,
  enableAutoSessionTracking: false,
  environment: IS_TEST_FLIGHT ? 'Testflight' : SENTRY_ENVIRONMENT,
  ignoreErrors: IGNORED_ERRORS,
  integrations: [Sentry.httpClientIntegration(), sentryNavigationIntegration, sentryAppStartIntegration],
  maxBreadcrumbs: 10,
  // App-start transactions are always sampled so the Amplitude forwarder above
  // sees every cold/warm start. Other transactions get baseline sampling — full
  // in dev/staging for visibility, 10% in prod to keep Sentry traffic bounded.
  tracesSampler: ({ name, transactionContext }) => {
    const transactionName = name ?? transactionContext?.name;
    if (transactionName?.startsWith('app.start.')) return 1.0;
    return IS_DEV || SENTRY_ENVIRONMENT === 'Staging' ? 1.0 : 0.1;
  },
};

export function initSentry() {
  if (IS_TEST) {
    logger.debug(`[sentry]: disabled for test environment`);
    return;
  }
  try {
    const dist = `${VersionNumber.buildVersion}`; // MUST BE A STRING
    const release = `${VersionNumber.bundleIdentifier}@${VersionNumber.appVersion}+${dist}`; // MUST BE A STRING

    Sentry.init({
      ...defaultOptions,
      dist, // MUST BE A STRING or Sentry will break in native code
      release, // MUST BE A STRING or Sentry will break in native code
    });

    logger.debug(`[sentry]: Successfully initialized`);
  } catch (e) {
    logger.error(new RainbowError(`[sentry]: initialization failed`));
  }
}
