import { captureException } from '@sentry/react-native';
import sentryUtils from './sentry';

const Logger = {
  debug(...args: any[]) {
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}] ⚡⚡⚡ `);
      console.log(...args); // eslint-disable-line no-console
    }
  },

  error(...args: any[]) {
    if (__DEV__) {
      console.error(...args); // eslint-disable-line no-console
    }
  },

  log(...args: any[]) {
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
  sentry(...args: any[]) {
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
    }
    if (args.length === 1 && typeof args[0] === 'string') {
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      sentryUtils.addInfoBreadcrumb.apply(null, args);
    } else {
      const safeData = safelyStringifyWithFormat(args[1]);
      sentryUtils.addDataBreadcrumb(args[0], safeData);
    }
  },
  warn(...args: any[]) {
    if (__DEV__) {
      console.warn(...args); // eslint-disable-line no-console
    }
  },
};

const safelyStringifyWithFormat = (data: any) => {
  try {
    const seen: any = [];
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
