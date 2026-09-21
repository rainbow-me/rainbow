import { type SportsCatalog } from './catalog';

export type SportsHost = 'main' | 'predictions';

export type SportsDestination = { type: 'live' } | { type: 'all' } | { type: 'scope'; scopeId: string };

export type SportsWindow = { from: string; until: string };

export function getSportsDestinationKey(destination: SportsDestination): string {
  return destination.type === 'scope' ? `scope:${destination.scopeId}` : destination.type;
}

export function getSportsWindow(now = new Date()): SportsWindow {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  return { from: from.toISOString(), until: until.toISOString() };
}

export function getSportsNavigationRoot(catalog: SportsCatalog | undefined, destination: SportsDestination): SportsDestination {
  if (destination.type !== 'scope' || !catalog) return destination;
  return catalog.scopes[destination.scopeId]?.navigationRoot ?? { type: 'all' };
}

export function getSportsParentDestination(
  catalog: SportsCatalog | undefined,
  destination: SportsDestination,
  navigationRoot: SportsDestination
): SportsDestination | undefined {
  const root = getSportsNavigationRoot(catalog, navigationRoot);
  if (destination.type !== 'scope' || (root.type === 'scope' && destination.scopeId === root.scopeId)) return undefined;
  const parentId = catalog?.scopes[destination.scopeId]?.parentId;
  return parentId ? { type: 'scope', scopeId: parentId } : root;
}

export function hasCompetitionDirectory(catalog: SportsCatalog | undefined, scopeId: string): boolean {
  return catalog?.scopes[scopeId]?.directoryIds !== undefined;
}

export function scopeContainsGame(catalog: SportsCatalog | undefined, scopeId: string, competitionIds: string[]): boolean {
  return competitionIds.some(id => id === scopeId || catalog?.scopes[id]?.parentId === scopeId);
}
