import { shallowEqual } from '@/worklets/comparisons';

/** Compares ordered placement items without traversing their market, asset, or event data. */
export function arePlacementItemsEqual<T>(previous: T[] | undefined, next: T[] | undefined): boolean {
  if (previous === next) return true;
  if (!previous || !next || previous.length !== next.length) return false;

  for (let i = 0; i < previous.length; i++) {
    if (!shallowEqual(previous[i], next[i])) return false;
  }

  return true;
}
