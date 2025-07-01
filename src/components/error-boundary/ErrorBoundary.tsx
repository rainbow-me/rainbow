import React from 'react';
import * as Sentry from '@sentry/react-native';
import Fallback from './Fallback';
import { IS_TEST } from '@/env';
import { useTheme } from '@/theme';
import { analytics } from '@/analytics';

const NoErrorBoundary = ({ children }: { children: React.ReactNode }) => children;

function onReset(error: unknown, componentStack: string | null | undefined, eventId: string | null) {
  analytics.track(analytics.event.errorBoundaryReset, {
    error,
    componentStack: componentStack || '',
    eventId: eventId || '',
  });
}
function onError(error: unknown, componentStack: string | null | undefined, eventId: string | undefined) {
  analytics.track(analytics.event.errorBoundary, {
    error,
    componentStack: componentStack || '',
    eventId: eventId || '',
  });
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
