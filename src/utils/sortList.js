import { get } from 'lodash';

export default (array = [], sortByKey, defaultValue = '') =>
  array.slice(0).sort((a, b) => {
    const itemA = sortByKey ? get(a, sortByKey, defaultValue) : a;
    const itemB = sortByKey ? get(b, sortByKey, defaultValue) : b;

    if (typeof itemA === 'string' && typeof itemB === 'string') {
      if (itemA.toLowerCase() < itemB.toLowerCase()) return -1;
      if (itemA.toLowerCase() > itemB.toLowerCase()) return 1;
    }

    if (itemA < itemB) return -1;
    if (itemA > itemB) return 1;
    return 0;
  });
