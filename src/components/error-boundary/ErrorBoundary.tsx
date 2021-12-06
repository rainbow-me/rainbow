import { captureException } from '@sentry/react-native';
import React from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Fallback' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Fallback from './Fallback';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

class ErrorBoundary extends React.Component {
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
    logger.sentry('Error is', error);
    const customError = new Error('React Crash');
    captureException(customError);
  }
  render() {
    if (this.state.hasError) {
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <Fallback />;
    }

    return this.props.children;
  }
}

const NoErrorBoundary = ({ children }: { children: React.ReactChild }) =>
  children;

const DefaultBoundary = IS_TESTING ? NoErrorBoundary : ErrorBoundary;

export default DefaultBoundary;
