import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';

import { getNextMidnight, type SportsWindow } from './browse';
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

type GameSelection = {
  games: Game[];
  sections: SportsSection[];
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
 * Groups an eligible browse response in its supplied order, capped at thirty Games per section.
 * Live groups follow catalog order; scope pages show live, today, then upcoming.
 */
export function groupSportsGames(catalog: SportsCatalog | undefined, games: readonly Game[], scope?: SportsGamesScope): GameSelection {
  return scope ? groupScopeGames(games, scope.window) : groupLiveGames(catalog, games);
}

/** Reselects stored Games after their section inputs or calendar window change. */
export function selectSportsGames(catalog: SportsCatalog | undefined, games: readonly Game[], scope?: SportsGamesScope): GameSelection {
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

function groupLiveGames(catalog: SportsCatalog | undefined, games: readonly Game[]): GameSelection {
  const groups: Partial<Record<string, Game[]>> = {};

  for (const game of games) {
    const groupId = getLiveGroupId(catalog, game);
    if (groupId) addGame((groups[groupId] ??= []), game);
  }

  const selection: GameSelection = { games: [], sections: [] };

  for (const scopeId of catalog?.liveGroupOrder ?? []) {
    const games = groups[scopeId];
    if (games) addSection(selection, games, 'live', scopeId);
  }

  return selection;
}

function groupScopeGames(games: readonly Game[], window: SportsWindow): GameSelection {
  const tomorrow = getNextMidnight(new Date(window.from));
  const groups: Record<ScheduleSectionType, Game[]> = { live: [], today: [], upcoming: [] };

  for (const game of games) {
    addGame(groups[getScheduleSectionType(game, tomorrow)], game);
  }

  const selection: GameSelection = { games: [], sections: [] };

  for (const type of SCHEDULE_SECTION_TYPES) addSection(selection, groups[type], type);

  return selection;
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

/** Compares a Game’s status, start time, and competitions. */
export function areSectionFieldsEqual(first: Game | undefined, second: Game | undefined): boolean {
  if (first === second) return true;
  if (!first || !second) return false;

  return (
    first.status === second.status && first.startsAt === second.startsAt && areArraysEqual(first.competitionIds, second.competitionIds)
  );
}

/** Compares section placement for the specified Game IDs. */
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

function getScheduleSectionType(game: Game, tomorrow: number): ScheduleSectionType {
  if (isLive(game)) return 'live';
  return getStartTime(game) < tomorrow ? 'today' : 'upcoming';
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

function addGame(games: Game[], game: Game): void {
  if (games.length < MAX_SPORTS_SECTION_GAMES) games.push(game);
}

function addSection(selection: GameSelection, games: Game[], type: SportsSection['type'], scopeId?: string): void {
  if (!games.length) return;

  selection.games.push(...games);
  selection.sections.push({ type, scopeId, gameIds: games.map(game => game.id) });
}
