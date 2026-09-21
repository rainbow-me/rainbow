import { getSportsWindow, hasCompetitionDirectory, scopeContainsGame, type SportsDestination } from './browse';
import { type SportsCatalog, type SportsScope } from './catalog';
import { Game_Status, type Game } from './generated/sports';

export const MAX_SPORTS_SECTION_GAMES = 30;

export type SportsSection = {
  type: 'live' | 'today' | 'upcoming' | 'search';
  scopeId?: string;
  gameIds: string[];
};

type SportsGames = {
  catalog: SportsCatalog | undefined;
  games: Partial<Record<string, Game>>;
  gameIds: readonly string[];
};

export function getSportsSections({
  catalog,
  games,
  gameIds,
  destination,
  now = new Date(),
}: SportsGames & { destination: SportsDestination; now?: Date }): SportsSection[] {
  if (destination.type === 'all') return [];
  const available = availableGames(gameIds, games);

  const matching = available.filter(game =>
    destination.type === 'live'
      ? game.status === Game_Status.STATUS_LIVE
      : scopeContainsGame(catalog, destination.scopeId, game.competitionIds)
  );
  matching.sort(
    (first, second) =>
      (catalog?.promotedRanks[first.id] ?? Infinity) - (catalog?.promotedRanks[second.id] ?? Infinity) ||
      (first.startsAt ? Date.parse(first.startsAt) : Infinity) - (second.startsAt ? Date.parse(second.startsAt) : Infinity) ||
      (first.id < second.id ? -1 : first.id > second.id ? 1 : 0)
  );
  if (destination.type === 'live') return liveSections(matching, catalog);

  const live: string[] = [];
  const today: string[] = [];
  const upcoming: string[] = [];
  const window = getSportsWindow(now);
  const from = Date.parse(window.from);
  const until = Date.parse(window.until);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const directory = hasCompetitionDirectory(catalog, destination.scopeId);

  for (const game of matching) {
    if (game.status === Game_Status.STATUS_LIVE) {
      live.push(game.id);
    } else if (!directory && game.status === Game_Status.STATUS_SCHEDULED && game.startsAt) {
      const start = Date.parse(game.startsAt);
      if (start >= from && start < until) (start < tomorrow ? today : upcoming).push(game.id);
    }
  }

  const sections: SportsSection[] = [];
  if (live.length) sections.push({ type: 'live', gameIds: live.slice(0, MAX_SPORTS_SECTION_GAMES) });
  if (today.length) sections.push({ type: 'today', gameIds: today.slice(0, MAX_SPORTS_SECTION_GAMES) });
  if (upcoming.length) sections.push({ type: 'upcoming', gameIds: upcoming.slice(0, MAX_SPORTS_SECTION_GAMES) });
  return sections;
}

export function getSportsDirectoryCounts({ catalog, games, gameIds }: SportsGames): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of catalog?.scopeIds ?? []) counts[id] = 0;
  for (const game of availableGames(gameIds, games)) {
    const scopes = new Set<string>();
    for (const competitionId of game.competitionIds) {
      const sportId = catalog?.scopes[competitionId]?.parentId;
      if (sportId) {
        scopes.add(competitionId);
        scopes.add(sportId);
      }
    }
    for (const scopeId of scopes) counts[scopeId] += 1;
  }
  return counts;
}

function availableGames(gameIds: readonly string[], games: Partial<Record<string, Game>>): Game[] {
  const available: Game[] = [];
  for (const id of new Set(gameIds)) {
    const game = games[id];
    if (game) available.push(game);
  }
  return available;
}

function liveSections(games: Game[], catalog: SportsCatalog | undefined): SportsSection[] {
  const grouped = new Map<string, string[]>();
  for (const game of games) {
    let liveGroup: SportsScope['liveGroup'];
    for (const competitionId of game.competitionIds) {
      const candidate = catalog?.scopes[competitionId]?.liveGroup;
      if (candidate && (!liveGroup || candidate.rank < liveGroup.rank)) liveGroup = candidate;
    }
    const scopeId = liveGroup?.id ?? game.competitionIds[0];
    if (!scopeId) continue;
    const group = grouped.get(scopeId);
    if (group) group.push(game.id);
    else grouped.set(scopeId, [game.id]);
  }
  const sections: SportsSection[] = [];
  for (const scopeId of catalog?.liveGroupOrder ?? []) {
    const gameIds = grouped.get(scopeId);
    if (gameIds) sections.push({ type: 'live', scopeId, gameIds: gameIds.slice(0, MAX_SPORTS_SECTION_GAMES) });
  }
  return sections;
}
