import { type SportsCatalog } from './catalog';

/** Screens with independent Sports navigation and a shared game cache. */
export type SportsHost = 'main' | 'predictions';

/**
 * A browse destination: global Live, the All sports directory, or a catalog sport or competition ID.
 */
export type SportsDestination = string;

/**
 * Local schedule bounds as Unix timestamps in milliseconds.
 * Today is `[from, todayUntil)` and Upcoming is `[todayUntil, until)`. Live games are eligible independently of these bounds.
 */
export type SportsWindow = {
  from: number;
  todayUntil: number;
  until: number;
};

/**
 * Returns seven local calendar days beginning at today's midnight, with tomorrow's midnight separating Today and Upcoming.
 */
export function getSportsWindow(now = new Date()): SportsWindow {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  return {
    from: new Date(year, month, day).getTime(),
    todayUntil: new Date(year, month, day + 1).getTime(),
    until: new Date(year, month, day + 7).getTime(),
  };
}

/**
 * The local midnight that ends the day containing `time`.
 */
export function getNextMidnight(time: Date): number {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1).getTime();
}

/**
 * Resolves a browse origin to its category tab. Live and All are their own tabs.
 * Before the catalog arrives, preserves the origin; a scope absent from a loaded catalog resolves to All.
 */
export function getSportsCategory(catalog: SportsCatalog | undefined, origin: SportsDestination): SportsDestination {
  if (!catalog || !isSportsScope(origin)) return origin;
  return catalog.scopes[origin]?.category ?? 'all';
}

/**
 * Returns the parent scope, or the selected category's root when there is no parent.
 * The root itself, Live, and All have no Back destination.
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
