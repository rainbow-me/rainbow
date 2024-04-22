import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_PROD } from '@/env';
import { logger, RainbowError } from '@/logger';
import isTestFlight from '@/helpers/isTestFlight';

/**
 * We need to disable React Navigation instrumentation for E2E tests because
 * detox doesn't like setTimeout calls that are used inside When enabled detox
 * hangs and timeouts on all test cases
 */
export const sentryRoutingInstrumentation = IS_PROD ? new Sentry.ReactNavigationInstrumentation() : undefined;

export const defaultOptions: Sentry.ReactNativeOptions = {
  dsn: SENTRY_ENDPOINT,
  sendDefaultPii: true,
  enableAutoSessionTracking: true,
  environment: isTestFlight ? 'Testflight' : SENTRY_ENVIRONMENT,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: sentryRoutingInstrumentation,
      tracingOrigins: ['localhost', /^\//],
    }),
  ],
  tracesSampleRate: 0.2,
};

export async function initSentry() {
  try {
    const dist = `${VersionNumber.buildVersion}`; // MUST BE A STRING
    const release = `${VersionNumber.bundleIdentifier}@${VersionNumber.appVersion}+${dist}`; // MUST BE A STRING

    Sentry.init({
      ...defaultOptions,
      dist, // MUST BE A STRING or Sentry will break in native code
      release, // MUST BE A STRING or Sentry will break in native code
    });

    logger.debug(`Sentry initialized`);
  } catch (e) {
    logger.error(new RainbowError(`Sentry initialization failed`));
  }
}
