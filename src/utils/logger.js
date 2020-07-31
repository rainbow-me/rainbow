import { captureException } from '@sentry/react-native';
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
      const safeData = safelyStringifyWithFormat(args[1]);
      sentryUtils.addDataBreadcrumb(args[0], safeData);
    }
    if (__DEV__) {
      console.log(...args);
    }
  },
  warn(...args) {
    if (__DEV__) {
      console.warn(...args);
    }
  },
};

const safelyStringifyWithFormat = data => {
  try {
    const seen = [];
    const dataToLog = typeof data === 'object' ? data : { data };
    const newData = JSON.stringify(
      dataToLog,
      // Required to ignore cyclic structures
      (key, val) => {
        if (val != null && typeof val == 'object') {
          if (seen.indexOf(val) >= 0) {
            return;
          }
          seen.push(val);
        }
        return val;
      },
      2
    );
    return newData;
  } catch (e) {
    captureException(e);
    return {};
  }
};

export default Logger;
