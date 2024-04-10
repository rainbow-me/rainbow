import { KeyOption, matchSorter, MatchSorterOptions } from 'match-sorter';

export const filterList = <T>(list: T[], searchQuery: string, keys?: KeyOption<T>[], options?: MatchSorterOptions<T>) =>
  matchSorter(list, searchQuery, {
    keys,
    ...options,
  });

export const filterListWorklet = <T>(list: T[], searchQuery: string, keys?: KeyOption<T>[], options?: MatchSorterOptions<T>) => {
  'worklet';
  return matchSorter(list, searchQuery, {
    keys,
    ...options,
  });
};
