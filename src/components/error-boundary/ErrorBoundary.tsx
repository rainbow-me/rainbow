import { captureException, captureMessage } from '@sentry/react-native';
import React from 'react';
import Fallback from './Fallback';

export default class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: any, errorInfo: any) {
    // log captured error to Sentry
    captureException(error);
    captureMessage(errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }

    return this.props.children;
  }
}
