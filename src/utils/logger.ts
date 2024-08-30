import { captureException } from '@sentry/react-native';
import { QUIET_OLD_LOGGER } from 'react-native-dotenv';
import sentryUtils from './sentry';

/**
 * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
 */
const Logger = {
  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  debug(...args: any[]) {
    if (QUIET_OLD_LOGGER) return;
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}] ⚡⚡⚡ `);
      console.log(...args); // eslint-disable-line no-console
    }
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  error(...args: any[]) {
    if (QUIET_OLD_LOGGER) return;
    if (__DEV__) {
      console.error(...args); // eslint-disable-line no-console
    }
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  log(...args: any[]) {
    if (QUIET_OLD_LOGGER) return;
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
    }
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  prettyLog() {
    if (QUIET_OLD_LOGGER) return;
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

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  sentry(...args: any[]) {
    if (QUIET_OLD_LOGGER) return;
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
    }
    if (args.length === 1 && typeof args[0] === 'string') {
      sentryUtils.addInfoBreadcrumb.apply(null, [args[0]]);
    } else {
      const safeData = safelyStringifyWithFormat(args[1]);
      sentryUtils.addDataBreadcrumb(args[0], safeData);
    }
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  warn(...args: any[]) {
    if (QUIET_OLD_LOGGER) return;
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
