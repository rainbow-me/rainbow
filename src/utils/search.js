import { get, toLower } from 'lodash';
import matchSorter from 'match-sorter';

export const filterList = (list, searchQuery, keys = null, options = null) =>
  matchSorter(list, searchQuery, {
    keys,
    ...options,
  });

export const filterScams = (safeList, nonSafeList) => {
  if (!safeList || !safeList.length) return nonSafeList;
  return nonSafeList.filter(item => {
    for (let i = 0; i < safeList.length; i++) {
      if (
        toLower(get(safeList[i], 'symbol')) === toLower(item.symbol) ||
        toLower(get(safeList[i], 'name')) === toLower(item.name)
      ) {
        return false;
      }
    }
    return true;
  });
};
