import React from 'react';
import Fallback from './Fallback';

export default class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: any, errorInfo: any) {
    // log to Sentry here:
    console.log('error info: ', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }

    return this.props.children;
  }
}
