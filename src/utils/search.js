import matchSorter from 'match-sorter';

export const filterList = (list, searchQuery, keys = null) =>
  matchSorter(list, searchQuery, {
    keys,
  });
