import { get, isFunction, isString, toLower } from 'lodash';

export const sortList = (
  array = [],
  sortByKey: any,
  direction: any,
  defaultValue: any,
  formatter: any
) =>
  array.slice(0).sort((a, b) => {
    const isAscending = direction === 'asc';

    let itemA = a;
    let itemB = b;

    if (sortByKey) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
      itemA = get(a, sortByKey, defaultValue);
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
      itemB = get(b, sortByKey, defaultValue);
    }

    if (isFunction(formatter)) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
      itemA = formatter(itemA);
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
      itemB = formatter(itemB);
    }

    if (isString(itemA) && isString(itemB)) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
      itemA = toLower(itemA);
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
      itemB = toLower(itemB);
    }

    if (itemA < itemB) return isAscending ? -1 : 1;
    if (itemA > itemB) return isAscending ? 1 : -1;

    return 0;
  });
