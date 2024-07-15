import React from 'react';
import * as Sentry from '@sentry/react-native';
import Fallback from './Fallback';
import { IS_TEST } from '@/env';
import { useTheme } from '@/theme';

const NoErrorBoundary = ({ children }: { children: React.ReactNode }) => children;

const ErrorBoundaryWithSentry = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <Sentry.ErrorBoundary
      beforeCapture={scope => scope.setTag('RainbowErrorBoundary', 'true')}
      fallback={props => <Fallback {...props} colors={colors} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

const ErrorBoundaryForEnvironment = IS_TEST ? NoErrorBoundary : ErrorBoundaryWithSentry;

export default ErrorBoundaryForEnvironment;
