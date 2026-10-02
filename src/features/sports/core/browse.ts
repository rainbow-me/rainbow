import { type SportsCatalog } from './catalog';

/**
 * The Sports screen or the Sports category in Predictions.
 */
export type SportsHost = 'main' | 'predictions';

/**
 * A browse destination: `live`, `all`, or a sport or competition ID.
 */
export type SportsDestination = string;

/**
 * Local schedule boundaries as Unix timestamps in milliseconds.
 * Today spans `[from, todayUntil)`; Upcoming spans `[todayUntil, until)`.
 */
export type SportsWindow = {
  from: number;
  todayUntil: number;
  until: number;
};

/**
 * Returns a seven-day schedule window starting at today's local midnight.
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
 * Returns the next local midnight as a Unix timestamp in milliseconds.
 */
export function getNextMidnight(time: Date): number {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate() + 1).getTime();
}

/**
 * Returns a destination's category tab, falling back to All for an unknown scope.
 * Leaves the destination unchanged while the catalog is unavailable.
 */
export function getSportsCategory(catalog: SportsCatalog | undefined, origin: SportsDestination): SportsDestination {
  if (!catalog || !isSportsScope(origin)) return origin;
  return catalog.scopes[origin]?.category ?? 'all';
}

/**
 * Returns the Back destination within the selected category, if one exists.
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
