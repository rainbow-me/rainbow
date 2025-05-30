import React from 'react';
import * as Sentry from '@sentry/react-native';
import Fallback from './Fallback';
import { IS_TEST } from '@/env';
import { useTheme } from '@/theme';
import { analytics } from '@/analytics';

const NoErrorBoundary = ({ children }: { children: React.ReactNode }) => children;

function onReset(error: Error | null) {
  analytics.track(analytics.event.errorBoundaryReset, { error });
}
function onError(error: Error | null) {
  analytics.track(analytics.event.errorBoundary, { error });
}

const ErrorBoundaryWithSentry = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <Sentry.ErrorBoundary
      beforeCapture={scope => scope.setTag('RainbowErrorBoundary', 'true')}
      onError={onError}
      onReset={onReset}
      fallback={props => <Fallback {...props} colors={colors} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

const ErrorBoundaryForEnvironment = IS_TEST ? NoErrorBoundary : ErrorBoundaryWithSentry;

export default ErrorBoundaryForEnvironment;
