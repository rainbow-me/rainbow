import { getSportsWindow, hasCompetitionDirectory, scopeContainsGame, type SportsDestination } from './browse';
import { type SportsCatalog, type SportsScope } from './catalog';
import { Game_Status, type Game } from './generated/sports';

// ============ Types ========================================================== //

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

type SectionGame = { game: Game; startsAt: number };

// ============ Constants ====================================================== //

export const MAX_SPORTS_SECTION_GAMES = 30;

// ============ Sections ======================================================= //

export function getSportsSections({
  catalog,
  games,
  gameIds,
  destination,
  now = new Date(),
}: SportsGames & { destination: SportsDestination; now?: Date }): SportsSection[] {
  if (destination.type === 'all') return [];

  let schedule: { from: number; until: number } | undefined;
  if (destination.type === 'scope' && !hasCompetitionDirectory(catalog, destination.scopeId)) {
    const window = getSportsWindow(now);
    schedule = { from: Date.parse(window.from), until: Date.parse(window.until) };
  }

  const matching: SectionGame[] = [];
  for (const id of gameIds) {
    const game = games[id];
    if (!game) continue;
    if (game.status !== Game_Status.STATUS_LIVE && (!schedule || game.status !== Game_Status.STATUS_SCHEDULED)) continue;
    if (destination.type === 'scope' && !scopeContainsGame(catalog, destination.scopeId, game.competitionIds)) continue;

    const startsAt = game.startsAt ? Date.parse(game.startsAt) : Infinity;
    if (schedule && game.status === Game_Status.STATUS_SCHEDULED && !(startsAt >= schedule.from && startsAt < schedule.until)) continue;

    matching.push({ game, startsAt });
  }

  matching.sort(
    (first, second) =>
      (catalog?.promotedRanks[first.game.id] ?? Infinity) - (catalog?.promotedRanks[second.game.id] ?? Infinity) ||
      first.startsAt - second.startsAt ||
      (first.game.id < second.game.id ? -1 : first.game.id > second.game.id ? 1 : 0)
  );

  if (destination.type === 'live') return buildLiveSections(matching, catalog);

  const live: string[] = [];
  const today: string[] = [];
  const upcoming: string[] = [];
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

  for (const { game, startsAt } of matching) {
    const section = game.status === Game_Status.STATUS_LIVE ? live : startsAt < tomorrow ? today : upcoming;
    if (section.length < MAX_SPORTS_SECTION_GAMES) section.push(game.id);
  }

  const sections: SportsSection[] = [];
  if (live.length) sections.push({ type: 'live', gameIds: live });
  if (today.length) sections.push({ type: 'today', gameIds: today });
  if (upcoming.length) sections.push({ type: 'upcoming', gameIds: upcoming });
  return sections;
}

// ============ Directory Counts ============================================== //

export function getSportsDirectoryCounts({ catalog, games, gameIds }: SportsGames): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of catalog?.scopeIds ?? []) counts[id] = 0;
  for (const id of new Set(gameIds)) {
    const game = games[id];
    if (!game) continue;

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

// ============ Helpers ======================================================== //

function buildLiveSections(games: SectionGame[], catalog: SportsCatalog | undefined): SportsSection[] {
  const grouped = new Map<string, string[]>();
  for (const { game } of games) {
    let liveGroup: SportsScope['liveGroup'];
    for (const competitionId of game.competitionIds) {
      const candidate = catalog?.scopes[competitionId]?.liveGroup;
      if (candidate && (!liveGroup || candidate.rank < liveGroup.rank)) liveGroup = candidate;
    }
    const scopeId = liveGroup?.id ?? game.competitionIds[0];
    if (!scopeId) continue;
    const group = grouped.get(scopeId);
    if (!group) grouped.set(scopeId, [game.id]);
    else if (group.length < MAX_SPORTS_SECTION_GAMES) group.push(game.id);
  }
  const sections: SportsSection[] = [];
  for (const scopeId of catalog?.liveGroupOrder ?? []) {
    const gameIds = grouped.get(scopeId);
    if (gameIds) sections.push({ type: 'live', scopeId, gameIds });
  }
  return sections;
}
