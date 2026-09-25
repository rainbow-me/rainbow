import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';

import { type SportsWindow } from './browse';
import { type SportsCatalog, type SportsScope } from './catalog';
import { Game_Status, type Game } from './generated/sports';

// ============ Types ========================================================== //

export type SportsSection = {
  type: 'live' | 'today' | 'upcoming' | 'search';
  scopeId?: string;
  gameIds: string[];
};

type ScheduleSectionType = 'live' | 'today' | 'upcoming';

export type SportsGamesScope = {
  scopeId: string;
  window: SportsWindow;
};

type RankedGame = {
  game: Game;
  rank: number;
  startsAt: number;
};

// ============ Constants ====================================================== //

export const MAX_SPORTS_SECTION_GAMES = 30;

const SCHEDULE_SECTION_TYPES: readonly ScheduleSectionType[] = ['live', 'today', 'upcoming'];
const LAST = Number.MAX_SAFE_INTEGER;

// ============ Sections ======================================================= //

/**
 * Groups a bounded browse response, preserving the server's membership and order within each section.
 * Live groups follow catalog order; sport and competition pages show live, today, then upcoming.
 */
export function groupSportsGames(catalog: SportsCatalog | undefined, games: readonly Game[], scope?: SportsGamesScope): SportsSection[] {
  return scope ? groupScopeGames(games, scope.window) : groupLiveGames(catalog, games);
}

/**
 * Filters stored games for a page, sorts by promotion, start time, then ID, and caps each section at thirty games.
 */
export function selectSportsGames(catalog: SportsCatalog | undefined, games: readonly Game[], scope?: SportsGamesScope): SportsSection[] {
  const showsSchedule = scope && !catalog?.scopes[scope.scopeId]?.directoryIds;
  const from = scope ? Date.parse(scope.window.from) : 0;
  const until = scope ? Date.parse(scope.window.until) : 0;
  const ranked: RankedGame[] = [];

  for (const game of games) {
    if (scope && !isInScope(catalog, scope.scopeId, game)) continue;

    const startsAt = getStartTime(game);
    const isScheduled = showsSchedule && game.status === Game_Status.STATUS_SCHEDULED && startsAt >= from && startsAt < until;
    if (isLive(game) || isScheduled) ranked.push(rankGame(catalog, game, startsAt));
  }

  return groupSportsGames(
    catalog,
    ranked.sort(compareRankedGames).map(entry => entry.game),
    scope
  );
}

function groupLiveGames(catalog: SportsCatalog | undefined, games: readonly Game[]): SportsSection[] {
  const groups: Partial<Record<string, string[]>> = {};

  for (const game of games) {
    const groupId = getLiveGroupId(catalog, game);
    if (groupId) addGame((groups[groupId] ??= []), game);
  }

  const sections: SportsSection[] = [];

  for (const scopeId of catalog?.liveGroupOrder ?? []) {
    const gameIds = groups[scopeId];
    if (gameIds) sections.push({ type: 'live', scopeId, gameIds });
  }

  return sections;
}

function groupScopeGames(games: readonly Game[], window: SportsWindow): SportsSection[] {
  const todayUntil = Date.parse(window.todayUntil);
  const groups: Record<ScheduleSectionType, string[]> = { live: [], today: [], upcoming: [] };

  for (const game of games) {
    addGame(groups[getScheduleSectionType(game, todayUntil)], game);
  }

  const sections: SportsSection[] = [];

  for (const type of SCHEDULE_SECTION_TYPES) {
    const gameIds = groups[type];
    if (gameIds.length) sections.push({ type, gameIds });
  }

  return sections;
}

/**
 * Updates `next` in place with matching unchanged sections. Returns `previous` when the entire sequence is unchanged.
 */
export function reuseSections(previous: SportsSection[] | undefined, next: SportsSection[]): SportsSection[] {
  if (!previous || previous === next) return next;

  let unchanged = previous.length === next.length;

  for (let i = 0; i < next.length; i++) {
    const section = next[i];
    const before =
      previous[i]?.type === section.type && previous[i]?.scopeId === section.scopeId
        ? previous[i]
        : previous.find(candidate => candidate.type === section.type && candidate.scopeId === section.scopeId);

    if (before && areArraysEqual(before.gameIds, section.gameIds)) next[i] = before;
    if (next[i] !== previous[i]) unchanged = false;
  }

  return unchanged ? previous : next;
}

// ============ Section Inputs ================================================= //

/**
 * Compares the status, start time, and competitions of two games.
 */
export function areSectionFieldsEqual(first: Game | undefined, second: Game | undefined): boolean {
  if (first === second) return true;
  if (!first || !second) return false;

  return (
    first.status === second.status && first.startsAt === second.startsAt && areArraysEqual(first.competitionIds, second.competitionIds)
  );
}

/**
 * Compares status, start time, and competitions for the given game IDs in two sets of stored games.
 */
export function areSectionInputsEqual(
  previous: Partial<Record<string, Game>>,
  next: Partial<Record<string, Game>>,
  gameIds: Iterable<string>
): boolean {
  if (previous === next) return true;

  for (const id of gameIds) {
    if (!areSectionFieldsEqual(previous[id], next[id])) return false;
  }

  return true;
}

// ============ Helpers ======================================================== //

/**
 * The curated Live group that ranks first among the game's competitions, or its preferred competition.
 */
function getLiveGroupId(catalog: SportsCatalog | undefined, game: Game): string | undefined {
  let group: SportsScope['liveGroup'];

  for (const competitionId of game.competitionIds) {
    const candidate = catalog?.scopes[competitionId]?.liveGroup;
    if (candidate && (!group || candidate.rank < group.rank)) group = candidate;
  }

  return group?.id ?? game.competitionIds[0];
}

function getScheduleSectionType(game: Game, todayUntil: number): ScheduleSectionType {
  if (isLive(game)) return 'live';
  return getStartTime(game) < todayUntil ? 'today' : 'upcoming';
}

function isLive(game: Game): boolean {
  return game.status === Game_Status.STATUS_LIVE;
}

function isInScope(catalog: SportsCatalog | undefined, scopeId: string, game: Game): boolean {
  return game.competitionIds.some(id => id === scopeId || catalog?.scopes[id]?.parentId === scopeId);
}

function getStartTime(game: Game): number {
  return game.startsAt ? Date.parse(game.startsAt) : LAST;
}

function rankGame(catalog: SportsCatalog | undefined, game: Game, startsAt: number): RankedGame {
  return { game, rank: catalog?.promotedRanks[game.id] ?? LAST, startsAt };
}

function compareRankedGames(first: RankedGame, second: RankedGame): number {
  if (first.rank !== second.rank) return first.rank - second.rank;
  if (first.startsAt !== second.startsAt) return first.startsAt - second.startsAt;
  if (first.game.id === second.game.id) return 0;
  return first.game.id < second.game.id ? -1 : 1;
}

function addGame(gameIds: string[], game: Game): void {
  if (gameIds.length < MAX_SPORTS_SECTION_GAMES) gameIds.push(game.id);
}
