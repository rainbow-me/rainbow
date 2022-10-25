import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_PROD } from '@/env';
import { logger, RainbowError } from '@/logger';

/**
 * We need to disable React Navigation instrumentation for E2E tests because
 * detox doesn't like setTimeout calls that are used inside When enabled detox
 * hangs and timeouts on all test cases
 */
export const sentryRoutingInstrumentation = IS_PROD
  ? new Sentry.ReactNavigationInstrumentation()
  : undefined;

export const defaultOptions = {
  dsn: SENTRY_ENDPOINT,
  enableAutoSessionTracking: true,
  environment: SENTRY_ENVIRONMENT,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: sentryRoutingInstrumentation,
      tracingOrigins: ['localhost', /^\//],
    }),
  ],
  tracesSampleRate: 0.2,
};

export async function initSentry() {
  if (!IS_PROD) return;

  try {
    const dist = VersionNumber.buildVersion;
    const release = `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`;

    Sentry.init({
      ...defaultOptions,
      dist,
      release,
    });

    logger.debug(`Sentry initialized`);
  } catch (e) {
    logger.error(new RainbowError(`Sentry initialization failed`));
  }
}
