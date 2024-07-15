// import Sentry, { captureException } from '@sentry/react-native';
// import React, { PropsWithChildren } from 'react';
// // @ts-ignore
// import { IS_TESTING } from 'react-native-dotenv';
// import logger from '@/utils/logger';

// class ErrorBoundary extends React.Component<PropsWithChildren> {
//   static getDerivedStateFromError(_error: any) {
//     return { hasError: true };
//   }

//   state = { hasError: false };

//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     // log captured error to Sentry
//     logger.sentry(`Unhandled JS error caught by Error Boundary: ${JSON.stringify(errorInfo)}`);
//     logger.sentry('Error is', error);
//     const customError = new Error('React Crash');
//     captureException(customError);
//   }
//   render() {
//     if (this.state.hasError) {
//       return <Fallback />;
//     }

//     return this.props.children;
//   }
// }

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
