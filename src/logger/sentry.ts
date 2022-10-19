import * as Sentry from '@sentry/react-native';
import { SENTRY_ENDPOINT, SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import VersionNumber from 'react-native-version-number';

import { IS_TEST } from '@/env';

/**
 * We need to disable React Navigation instrumentation for E2E tests because
 * detox doesn't like setTimeout calls that are used inside When enabled detox
 * hangs and timeouts on all test cases
 */
export const sentryRoutingInstrumentation = IS_TEST
  ? undefined
  : new Sentry.ReactNavigationInstrumentation();

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
  const dist = VersionNumber.buildVersion;
  const release = `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`;

  Sentry.init({
    ...defaultOptions,
    dist,
    release,
  });
}
