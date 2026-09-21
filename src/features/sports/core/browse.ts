import { Sport_Browse, type Competition, type Sport, type SportsCatalog } from './generated/sports';

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

export function findScope(catalog: SportsCatalog | undefined, scopeId: string): Sport | Competition | undefined {
  for (const sport of catalog?.sports ?? []) {
    if (sport.id === scopeId) return sport;
    const competition = sport.competitions.find(competition => competition.id === scopeId);
    if (competition) return competition;
  }
}

export function getSportsNavigationRoot(catalog: SportsCatalog | undefined, destination: SportsDestination): SportsDestination {
  if (destination.type !== 'scope' || !catalog || catalog.prominentScopeIds.includes(destination.scopeId)) return destination;
  const parent = catalog.sports.find(sport => sport.competitions.some(competition => competition.id === destination.scopeId));
  return parent && catalog.prominentScopeIds.includes(parent.id) ? { type: 'scope', scopeId: parent.id } : { type: 'all' };
}

export function getSportsParentDestination(
  catalog: SportsCatalog | undefined,
  destination: SportsDestination,
  navigationRoot: SportsDestination
): SportsDestination | undefined {
  const root = getSportsNavigationRoot(catalog, navigationRoot);
  if (destination.type !== 'scope' || (root.type === 'scope' && destination.scopeId === root.scopeId)) return undefined;
  const parent = catalog?.sports.find(sport => sport.competitions.some(competition => competition.id === destination.scopeId));
  return parent ? { type: 'scope', scopeId: parent.id } : root;
}

export function hasCompetitionDirectory(catalog: SportsCatalog | undefined, scopeId: string): boolean {
  return catalog?.sports.some(sport => sport.id === scopeId && sport.browse === Sport_Browse.BROWSE_COMPETITIONS) ?? false;
}

export function scopeContainsGame(catalog: SportsCatalog | undefined, scopeId: string, competitionIds: string[]): boolean {
  if (competitionIds.includes(scopeId)) return true;
  const sport = catalog?.sports.find(sport => sport.id === scopeId);
  return sport?.competitions.some(competition => competitionIds.includes(competition.id)) ?? false;
}
