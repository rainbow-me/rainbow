import { STFU } from 'react-native-dotenv';
import { captureException } from '@sentry/react-native';
import { logger as loggr, RainbowError } from '@/logger';

/**
 * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
 */
const Logger = {
  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  debug(...args: any[]) {
    if (STFU) return;
    loggr.debug(args[0]);
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  error(...args: any[]) {
    if (STFU) return;
    loggr.error(new RainbowError(args[0]));
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  log(...args: any[]) {
    if (STFU) return;
    loggr.info(args[0]);
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  prettyLog() {
    if (STFU) return;
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
    if (STFU) return;
    if (args.length === 1 && typeof args[0] === 'string') {
      loggr.info(args[0]);
    } else {
      const safeData = safelyStringifyWithFormat(args[1]);
      loggr.info(`logger.sentry`, { safeData });
    }
  },

  /**
   * @deprecated use `@/logger` instead, and see `@/logger/README` for documentation
   */
  warn(...args: any[]) {
    if (STFU) return;
    loggr.warn(args[0]);
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
