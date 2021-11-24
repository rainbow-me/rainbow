
const Logger = {
  debug(...args) {
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}] ⚡⚡⚡ `);
      console.log(...args); // eslint-disable-line no-console
    }
  },

  error(...args) {
    if (__DEV__) {
      console.error(...args); // eslint-disable-line no-console
    }
  },

  log(...args) {
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
    if (__DEV__) {
      const date = new Date().toLocaleTimeString();
      Array.prototype.unshift.call(args, `[${date}]`);
      console.log(...args); // eslint-disable-line no-console
    }
    console.log('SENTRY ARGS: ', ...args)
  },
  warn(...args) {
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
    console.log(e);
    return {};
  }
};

export default Logger;
