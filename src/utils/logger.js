import { sentryUtils } from './';

export default class Logger {
  static log(...args) {
    if (__DEV__) {
      console.log.apply(null, args);
    }
  }

  static debug(...args) {
    if (__DEV__) {
      console.debug.apply(null, args);
    }
  }

  static warn(...args) {
    if (__DEV__) {
      console.warn.apply(null, args);
    }
  }

  static error(...args) {
    if (__DEV__) {
      console.error.apply(null, args);
    }
  }

  static sentry(...args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      sentryUtils.addInfoBreadcrumb.apply(null, args);
    } else {
      sentryUtils.addDataBreadcrumb.apply(null, args);
    }
  }
}
