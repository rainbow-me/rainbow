import { toLower } from 'lodash';
import { matchSorter } from 'match-sorter';

export const filterList = (
  list: any,
  searchQuery: any,
  keys = null,
  options = null
) =>
  matchSorter(list, searchQuery, {
    keys,
    // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
    ...options,
  });

export const filterScams = (safeList: any, nonSafeList: any) => {
  if (!safeList || !safeList.length) return nonSafeList;
  return nonSafeList.filter((item: any) => {
    for (let i = 0; i < safeList.length; i++) {
      if (
        toLower(safeList[i].symbol) === toLower(item.symbol) ||
        toLower(safeList[i].name) === toLower(item.name)
      ) {
        return false;
      }
    }
    return true;
  });
};
