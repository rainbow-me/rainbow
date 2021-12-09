// let cachedResult = 0;

/**
 * Memoization wrapper for common used PURE helper functions.
 * The function will be cached only if it receives number, string or boolean as params
 * PURE means that function accepts at least a single argument and returns
 * same result all the time same arguments are used.
 * In order to memoize the function, it should be defined only once as a static function - outside react components.
 *
 *
 * @export
 * @param {Function} fn - pure function with at least single argument
 * @returns {Function} - same function with a cache
 */
export default function memoFn(fn) {
  const cache = {};

  return (...args) => {
    // if no arguments used we just want the developer and run the function as is
    if (args.length === 0) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          `memoized function ${fn.name} was called with no arguments`
        );
      }

      // Call it anyway to not break stuff
      return fn.apply(null, args);
    }

    // we check for arguments to be number/boolean/string
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (
        typeof arg !== 'number' &&
        typeof arg !== 'boolean' &&
        typeof arg !== 'string'
      ) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(
            `memoized function ${
              fn.name
            } was called with non-supported arguments: ${JSON.stringify(
              args
            )}. Typeof of ${typeof arg}`
          );
        }

        // Call it anyway to not break stuff
        return fn.apply(null, args);
      }
    }

    const key = `key ${args.join(' , ')}`;

    if (cache[key]) {
      // For debugging
      // console.log('Used cached', key, cachedResult++);
      // return cached result
      return cache[key];
    } else {
      const res = fn.apply(null, args);
      // store in cache for future usage
      cache[key] = res;
      return res;
    }
  };
}
