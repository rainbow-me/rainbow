// let cachedCalls = 0;

import logger from './logger';

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
export function memoFn<TArgs extends unknown[], TReturn extends unknown>(
  fn: (...args: TArgs) => TReturn,
  keyMaker?: (...args: TArgs) => string
): typeof fn {
  const cache = new Map<string, TReturn>();

  // let cachedCall = 0;

  return function memoized(this: ThisType<typeof fn>, ...args: TArgs): TReturn {
    // if no arguments used we just want the developer and run the function as is
    if (args.length === 0) {
      if (__DEV__) {
        logger.warn(
          `memoized function ${fn.name} was called with no arguments`
        );
      }

      // Call it anyway to not break stuff
      // eslint-disable-next-line babel/no-invalid-this
      return fn.apply(this, args);
    }

    if (!keyMaker) {
      // we check for arguments to be number/boolean/string
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (
          typeof arg !== 'number' &&
          typeof arg !== 'boolean' &&
          typeof arg !== 'string'
        ) {
          if (__DEV__) {
            logger.warn(
              `memoized function ${
                fn.name
              } was called with non-supported arguments: ${JSON.stringify(
                args
              )}. Typeof of ${i + 1} argument is ${typeof arg}`
            );
          }

          // Call it anyway to not break stuff
          // eslint-disable-next-line babel/no-invalid-this
          return fn.apply(this, args);
        }
      }
    }

    const key = keyMaker
      ? keyMaker.apply(null, args)
      : `key ${args.join(' ~ ')}`;

    if (cache.has(key)) {
      // For debugging
      // logger.log(`Used cached ${cachedCall++} times result for function  ${fn.name} with arguments ${key});
      // logger.log('Total cached', cachedCalls++);
      // return cached result

      return cache.get(key)!; // we did a check for that key already
    } else {
      // eslint-disable-next-line babel/no-invalid-this
      const res = fn.apply(this, args);
      // store in cache for future usage
      cache.set(key, res);
      return res;
    }
  };
}
