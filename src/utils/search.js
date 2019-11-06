import matchSorter from 'match-sorter';

export const filterList = (list, searchQuery, searchListByKey) => {
  return matchSorter(list, searchQuery, {
    keys: searchListByKey ? [searchListByKey] : null,
  });
};
