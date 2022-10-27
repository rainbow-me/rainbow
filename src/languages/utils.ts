/**
 * This proxy accepts an object and returns a proxy which concatenates a
 * string representing the key paths accessed
 *
 * For example:
 *     const prox = simpleObjectProxy({
 *       account: {
 *         hide: 'Hide'
 *       }
 *     }
 *
 *     prox.account.hide => "account.hide"
 *
 *
 * We're ignoring types here because we're not trying to make this an open
 * source library; we just need it to work for translations. It should be
 * safe, and we can write unit tests to ensure this is the case.
 */
export function simpleObjectProxy<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target: T, key: string) {
      // @ts-expect-error
      if (key === '__keypath__') return target.__keypath__;

      // @ts-expect-error
      const nextKeypath = target.__keypath__
        ? // @ts-expect-error
          target.__keypath__ + '.' + key
        : key;
      // @ts-expect-error
      let nextTarget = target[key];

      if (typeof nextTarget === 'string') {
        nextTarget = new String(nextTarget);
      } else if (nextTarget === undefined) {
        nextTarget = {};
      }

      nextTarget.__keypath__ = nextKeypath;

      return simpleObjectProxy(nextTarget);
    },
  });
}
