import { captureException } from '@sentry/react-native';
import React, { PropsWithChildren } from 'react';
// @ts-ignore
import { IS_TESTING } from 'react-native-dotenv';
import Fallback from './Fallback';
import logger from '@/utils/logger';

class ErrorBoundary extends React.Component<PropsWithChildren> {
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // log captured error to Sentry
    logger.sentry(`Unhandled JS error caught by Error Boundary: ${JSON.stringify(errorInfo)}`);
    logger.sentry('Error is', error);
    const customError = new Error('React Crash');
    captureException(customError);
  }
  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }

    return this.props.children;
  }
}

const NoErrorBoundary = ({ children }: { children: React.ReactChild }) => children;

const DefaultBoundary = IS_TESTING ? NoErrorBoundary : ErrorBoundary;

export default DefaultBoundary;
