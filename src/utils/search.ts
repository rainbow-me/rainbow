import { matchSorter } from 'match-sorter';

export const filterList = (
  list: any[],
  searchQuery: string,
  keys = null,
  options = null
) =>
  matchSorter(list, searchQuery, {
    keys,
    // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
    ...options,
  });
