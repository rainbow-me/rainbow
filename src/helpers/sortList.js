import { get, isFunction, isString, toLower } from 'lodash';

export const sortList = (
  array = [],
  sortByKey,
  direction,
  defaultValue,
  formatter
) =>
  array.slice(0).sort((a, b) => {
    const isAscending = direction === 'asc';

    let itemA = a;
    let itemB = b;

    if (sortByKey) {
      itemA = get(a, sortByKey, defaultValue);
      itemB = get(b, sortByKey, defaultValue);
    }

    if (isFunction(formatter)) {
      itemA = formatter(itemA);
      itemB = formatter(itemB);
    }

    if (isString(itemA) && isString(itemB)) {
      itemA = toLower(itemA);
      itemB = toLower(itemB);
    }

    if (itemA < itemB) return isAscending ? -1 : 1;
    if (itemA > itemB) return isAscending ? 1 : -1;

    return 0;
  });
