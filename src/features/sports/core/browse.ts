import { type SportsCatalog } from './catalog';

export type SportsHost = 'main' | 'predictions';

/**
 * `'live'`, `'all'` (the sports directory), or a catalog scope ID.
 */
export type SportsDestination = string;

export type SportsWindow = {
  from: string;
  todayUntil: string;
  until: string;
};

/**
 * The local week, from today's midnight, in which scheduled games are shown.
 */
export function getSportsWindow(now = new Date()): SportsWindow {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  return {
    from: new Date(year, month, day).toISOString(),
    todayUntil: new Date(year, month, day + 1).toISOString(),
    until: new Date(year, month, day + 7).toISOString(),
  };
}

/**
 * The local midnight that ends the day containing `time`.
 */
export function getNextMidnight(time: Date): number {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1).getTime();
}

/**
 * The category tab that stays selected while the user browses from `category`.
 */
export function getSportsCategory(catalog: SportsCatalog | undefined, category: SportsDestination): SportsDestination {
  if (!catalog || !isSportsScope(category)) return category;
  return catalog.scopes[category]?.category ?? 'all';
}

/**
 * Where Back leads from `destination`: its parent scope, then the category's root, which has no Back.
 */
export function getSportsBackDestination(
  catalog: SportsCatalog | undefined,
  destination: SportsDestination,
  category: SportsDestination
): SportsDestination | undefined {
  if (!isSportsScope(destination)) return undefined;

  const root = getSportsCategory(catalog, category);
  if (destination === root) return undefined;
  return catalog?.scopes[destination]?.parentId ?? root;
}

function isSportsScope(destination: SportsDestination): boolean {
  return destination !== 'live' && destination !== 'all';
}
