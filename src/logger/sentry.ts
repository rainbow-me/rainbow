import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_DEV, IS_STORE_INSTALL, IS_TEST } from '@/env';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger, RainbowError } from '@/logger';
import { redactIdentifiers } from '@/logger/redactIdentifiers';
import { sanitizeUrl } from '@/logger/sanitizeUrl';

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

/**
 * Every fetch and XHR produces a breadcrumb carrying the full request URL, and the SDK attaches
 * breadcrumbs to every event it sends.
 *
 * Both beforeBreadcrumb and beforeSend hooks need this, and neither is redundant. `beforeBreadcrumb`
 * is the only pass over breadcrumbs that JS forwards to the native scope, where they ride native crash events that
 * `beforeSend` never sees. `beforeSend` is the only pass over the breadcrumbs iOS merges onto an
 * event of its own accord, which never reach `beforeBreadcrumb`. Running twice is harmless: a
 * templated path and a placeholder both survive a second pass unchanged.
 */
function sanitizeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  const { data } = breadcrumb;
  if (data) {
    if (typeof data.url === 'string') {
      const safe = sanitizeUrl(data.url);
      if (safe) data.url = safe;
      else delete data.url;
    }
    // The native tracker keeps these beside the url, so sanitising the url alone leaves them behind.
    delete data['http.query'];
    delete data['http.fragment'];
  }

  if (breadcrumb.message) breadcrumb.message = redactIdentifiers(breadcrumb.message);

  return breadcrumb;
}

const MAX_METADATA_DEPTH = 3;

/**
 * Metadata is an open map of whatever a caller passed, so it has to be walked rather than assumed.
 *
 * **Only safe from `beforeSend`.** By then the event is Sentry's own normalised deep copy, so rewriting
 * it affects nothing else, and Errors have already been flattened to plain objects. `beforeBreadcrumb`
 * runs synchronously inside `addBreadcrumb`, and `sentryTransport` hands it a shallow copy of the
 * caller's metadata: walking there would rewrite strings inside objects the app is still using.
 */
function redactValues(container: Record<string, unknown> | unknown[], depth = 0): void {
  for (const [key, value] of Object.entries(container)) {
    if (typeof value === 'string') (container as Record<string, unknown>)[key] = redactIdentifiers(value);
    else if (value && typeof value === 'object' && depth < MAX_METADATA_DEPTH) {
      redactValues(value as Record<string, unknown>, depth + 1);
    }
  }
}

export const defaultOptions: Sentry.ReactNativeOptions = {
  attachStacktrace: true,

  beforeBreadcrumb: sanitizeBreadcrumb,
  beforeSend(event, hint) {
    // iOS merges its own network breadcrumbs onto the event after `beforeBreadcrumb` has run, so this
    // is the only hook that sees them, and they arrive with the path and query intact.
    for (const breadcrumb of event.breadcrumbs ?? []) {
      sanitizeBreadcrumb(breadcrumb);
      if (breadcrumb.data) redactValues(breadcrumb.data);
    }

    // Logger metadata lands here, and our own call sites pass addresses through it.
    if (event.extra) redactValues(event.extra);

    if (event.message) event.message = redactIdentifiers(event.message);
    for (const exception of event.exception?.values ?? []) {
      if (exception.value) exception.value = redactIdentifiers(exception.value);
    }

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
  enableAutoSessionTracking: true,
  environment: ENVIRONMENT,
  ignoreErrors: IGNORED_ERRORS,

  // Sentry's automatic HTTP failure capture, off deliberately. It reports every failed response
  // as `handled: false`, which native session accounting reads as an app crash, so our
  // dependencies' 5xx responses would depress crash-free rate and, on iOS, end the session and
  // start a replacement, inflating session counts too. The events it produces also carry no
  // operation, no attempt count and no app context.
  //
  // HTTP failures should be reported by the code that makes the request instead, where the
  // operation and the response are actually known and can be classified properly.
  enableCaptureFailedRequests: false,

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
