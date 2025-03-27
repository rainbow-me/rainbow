import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import isTestFlight from '@/helpers/isTestFlight';

const ERROR_MESSAGE_BLACKLIST = ['AbortError', 'Network request failed', 'There was an error with the request.'];

export const defaultOptions: Sentry.ReactNativeOptions = {
  attachStacktrace: true,
  dsn: SENTRY_ENDPOINT,
  enableAppHangTracking: false,
  enableAutoPerformanceTracing: false,
  enableAutoSessionTracking: false,
  enableTracing: false,
  environment: isTestFlight ? 'Testflight' : SENTRY_ENVIRONMENT,
  ignoreTransactions: ERROR_MESSAGE_BLACKLIST,
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
