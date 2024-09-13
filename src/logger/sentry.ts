import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_TEST } from '@/env';
import { logger, RainbowError } from '@/logger';
import isTestFlight from '@/helpers/isTestFlight';

export const defaultOptions: Sentry.ReactNativeOptions = {
  attachStacktrace: true,
  dsn: SENTRY_ENDPOINT,
  enableAppHangTracking: false,
  enableAutoPerformanceTracing: false,
  enableAutoSessionTracking: false,
  enableTracing: false,
  environment: isTestFlight ? 'Testflight' : SENTRY_ENVIRONMENT,
  integrations: [],
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
