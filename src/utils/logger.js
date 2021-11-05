import { captureException } from '@sentry/react-native';
import { NativeModules } from 'react-native';
import sentryUtils from './sentry';
const IOS_DEBUG_RELEASE = true;

function nativeDebug(level, ...args) {
  if (IOS_DEBUG_RELEASE) {
    NativeModules.NativeLogger.log(
      level + '::  ' + args.map(a => a.toString()).join(' // ')
    );
  }
}

const Logger = {
  debug(...args) {
    nativeDebug('debug', args);
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}] ⚡⚡⚡ `);
      console.log(...args); // eslint-disable-line no-console
    }
  },

  error(...args) {
    nativeDebug('error', args);

    if (__DEV__) {
      console.error(...args); // eslint-disable-line no-console
    }
  },

  log(...args) {
    nativeDebug('log', args);

    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
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
      console.log(allArgs.length > 0 ? allArgs : allArgs[0]); // eslint-disable-line no-console
    }
  },
  sentry(...args) {
    nativeDebug('sentry', args);
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
    }
    if (args.length === 1 && typeof args[0] === 'string') {
      sentryUtils.addInfoBreadcrumb.apply(null, args);
    } else {
      const safeData = safelyStringifyWithFormat(args[1]);
      sentryUtils.addDataBreadcrumb(args[0], safeData);
    }
  },
  warn(...args) {
    nativeDebug('warn', ...args);
    if (__DEV__) {
      console.warn(...args); // eslint-disable-line no-console
    }
  },
};

const safelyStringifyWithFormat = data => {
  try {
    const seen = [];
    const newData = JSON.stringify(
      data,
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
    return { data: newData };
  } catch (e) {
    captureException(e);
    return {};
  }
};

export default Logger;
