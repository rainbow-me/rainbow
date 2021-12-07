// let cachedResult = 0;

export const memoFn = fn => {
  const cache = {};

  return (...args) => {
    const key = args.join('-');

    if (cache[key]) {
      // For debugging
      // console.log('Used cached', key, cachedResult++);
      return cache[key];
    } else {
      const res = fn(...args);
      cache[key] = res;
      return res;
    }
  };
};
