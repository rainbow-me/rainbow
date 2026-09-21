import { Sport_Browse, type Competition, type Sport, type SportsCatalog } from './generated/sports';

export type SportsHost = 'main' | 'predictions';

export type SportsDestination = { type: 'live' } | { type: 'all' } | { type: 'scope'; scopeId: string };

export type SportsWindow = { from: string; until: string };

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

export function hasCompetitionDirectory(catalog: SportsCatalog | undefined, scopeId: string): boolean {
  return catalog?.sports.some(sport => sport.id === scopeId && sport.browse === Sport_Browse.BROWSE_COMPETITIONS) ?? false;
}

export function scopeContainsGame(catalog: SportsCatalog | undefined, scopeId: string, competitionIds: string[]): boolean {
  if (competitionIds.includes(scopeId)) return true;
  const sport = catalog?.sports.find(sport => sport.id === scopeId);
  return sport?.competitions.some(competition => competitionIds.includes(competition.id)) ?? false;
}
