import { captureException } from '@sentry/react-native';
import React from 'react';
import Fallback from './Fallback';
import logger from 'logger';

export default class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // log captured error to Sentry
    logger.sentry(
      `Unhandled JS error caught by Error Boundary: ${JSON.stringify(
        errorInfo
      )}`
    );
    captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }

    return this.props.children;
  }
}
