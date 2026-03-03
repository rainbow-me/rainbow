import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_TEST, IS_TEST_FLIGHT } from '@/env';
import { logger, RainbowError } from '@/logger';

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
  dsn: SENTRY_ENDPOINT,
  enableAppHangTracking: false,
  enableAutoPerformanceTracing: false,
  enableAutoSessionTracking: false,
  enableTracing: false,
  environment: IS_TEST_FLIGHT ? 'Testflight' : SENTRY_ENVIRONMENT,
  ignoreErrors: IGNORED_ERRORS,
  integrations: [Sentry.httpClientIntegration()], // http client integration will help us see payload / response from errored out requests to better understand the issue
  maxBreadcrumbs: 10,
  tracesSampleRate: 0,
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
