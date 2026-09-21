import { getSportsWindow, hasCompetitionDirectory, scopeContainsGame, type SportsDestination } from './browse';
import { Game_Status, type Game, type SportsCatalog } from './generated/sports';

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
  search = false,
  now = new Date(),
}: SportsGames & { destination: SportsDestination; search?: boolean; now?: Date }): SportsSection[] {
  const available = availableGames(gameIds, games);
  if (search) return available.length ? [{ type: 'search', gameIds: available.map(game => game.id) }] : [];
  if (destination.type === 'all') return [];

  const matching = available.filter(game =>
    destination.type === 'live'
      ? game.status === Game_Status.STATUS_LIVE
      : scopeContainsGame(catalog, destination.scopeId, game.competitionIds)
  );
  const promoted = new Map(catalog?.promotedGameIds.map((id, index) => [id, index]));
  matching.sort(
    (first, second) =>
      (promoted.get(first.id) ?? Infinity) - (promoted.get(second.id) ?? Infinity) ||
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
  if (live.length) sections.push({ type: 'live', gameIds: live });
  if (today.length) sections.push({ type: 'today', gameIds: today });
  if (upcoming.length) sections.push({ type: 'upcoming', gameIds: upcoming });
  return sections;
}

export function getSportsDirectoryCounts({ catalog, games, gameIds }: SportsGames): Record<string, number> {
  const counts: Record<string, number> = {};
  const sportsByCompetition = new Map<string, string>();
  for (const sport of catalog?.sports ?? []) {
    counts[sport.id] = 0;
    for (const competition of sport.competitions) {
      counts[competition.id] = 0;
      sportsByCompetition.set(competition.id, sport.id);
    }
  }
  for (const game of availableGames(gameIds, games)) {
    const scopes = new Set<string>();
    for (const competitionId of game.competitionIds) {
      const sportId = sportsByCompetition.get(competitionId);
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
    const scopeId = catalog?.liveGroupIds.find(id => scopeContainsGame(catalog, id, game.competitionIds)) ?? game.competitionIds[0];
    if (!scopeId) continue;
    const group = grouped.get(scopeId);
    if (group) group.push(game.id);
    else grouped.set(scopeId, [game.id]);
  }
  const order = new Set([
    ...(catalog?.liveGroupIds ?? []),
    ...(catalog?.sports.flatMap(sport => sport.competitions.map(competition => competition.id)) ?? []),
  ]);
  const sections: SportsSection[] = [];
  for (const scopeId of order) {
    const gameIds = grouped.get(scopeId);
    if (gameIds) sections.push({ type: 'live', scopeId, gameIds });
  }
  return sections;
}
