import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_DEV, IS_STORE_INSTALL, IS_TEST } from '@/env';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger, RainbowError } from '@/logger';

type Environment = 'production' | 'internal' | 'development';
const ENVIRONMENT: Environment = IS_DEV ? 'development' : IS_STORE_INSTALL ? 'production' : 'internal';

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

  dsn: SENTRY_ENDPOINT,
  enableAppHangTracking: false,
  enableAutoPerformanceTracing: false,
  enableAutoSessionTracking: false,
  environment: ENVIRONMENT,
  ignoreErrors: IGNORED_ERRORS,
  integrations: [Sentry.httpClientIntegration()], // http client integration will help us see payload / response from errored out requests to better understand the issue
  maxBreadcrumbs: 10,
  tracesSampleRate: 0,
};

export function initSentry() {
  // Use __DEV__ over IS_DEV as we only want to disable this on actual Metro dev builds, not when ENABLE_DEV_MODE is set
  if (IS_TEST || __DEV__) {
    logger.debug(`[sentry]: disabled for ${IS_TEST ? 'test' : 'dev'} session`);
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
