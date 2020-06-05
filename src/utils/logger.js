import sentryUtils from './sentry';

const Logger = {
  debug(...args) {
    if (__DEV__) {
      console.debug(...args);
    }
  },

  error(...args) {
    if (__DEV__) {
      console.error(...args);
    }
  },

  log(...args) {
    if (__DEV__) {
      console.log(...args);
    }
  },

  prettyLog() {
    if (__DEV__) {
      const allArgs = Array.prototype.slice.call(arguments).map(arg => {
        try {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          } else {
            return arg;
          }
        } catch (e) {
          return arg;
        }
      });
      console.log(allArgs.length > 0 ? allArgs : allArgs[0]);
    }
  },
  sentry(...args) {
    if (args.length === 1 && typeof args[0] === 'string') {
      sentryUtils.addInfoBreadcrumb.apply(null, args);
    } else {
      sentryUtils.addDataBreadcrumb.apply(null, args);
    }
  },
  warn(...args) {
    if (__DEV__) {
      console.warn(...args);
    }
  },
};

export default Logger;
