import sentryUtils from './sentry';

export default class Logger {
  static log(...args) {
    if (__DEV__) {
      console.log(...args);
    }
  }

  static debug(...args) {
    if (__DEV__) {
      console.debug(...args);
    }
  }

  static warn(...args) {
    if (__DEV__) {
      console.warn(...args);
    }
  }

  static error(...args) {
    if (__DEV__) {
      console.error(...args);
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
