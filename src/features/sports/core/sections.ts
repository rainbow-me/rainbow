import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';

import { type SportsWindow } from './browse';
import { type SportsCatalog, type SportsScope } from './catalog';
import { Game_Status, type Game } from './generated/sports';

// ============ Types ========================================================== //

/**
 * An ordered group of games displayed together in Sports.
 */
export type SportsSection = {
  type: 'live' | 'today' | 'upcoming' | 'search';
  /** The catalog group for global Live sections; absent for schedule and Search. */
  scopeId?: string;
  gameIds: string[];
};

/**
 * A sport or competition and its local schedule window.
 */
export type SportsBrowseScope = {
  scopeId: string;
  window: SportsWindow;
};

// ============ Constants ====================================================== //

/**
 * Maximum number of games displayed in a Sports section.
 */
export const MAX_SPORTS_SECTION_GAMES = 30;

const SCHEDULE_SECTION_TYPES = ['live', 'today', 'upcoming'] as const;

// ============ Sections ======================================================= //

/**
 * Groups games into global Live groups or a scope's schedule sections.
 * Preserves game order within each section and reuses unchanged sections and arrays
 * from the same destination's previous result.
 */
export function groupSportsGames(
  catalog: SportsCatalog | undefined,
  games: Readonly<Partial<Record<string, Game>>>,
  gameIds: Iterable<string>,
  scope?: SportsBrowseScope,
  previous?: SportsSection[]
): SportsSection[] {
  const scopeId = scope?.scopeId;
  const window = scope && !catalog?.scopes[scope.scopeId]?.directoryIds ? scope.window : undefined;
  const groups: Partial<Record<string, string[]>> = {};

  for (const id of gameIds) {
    const game = games[id];
    if (!game) continue;

    const sectionId = getSectionId(catalog, game, scopeId, window);
    if (!sectionId) continue;

    groups[sectionId] ??= [];
    const ids = groups[sectionId];
    if (ids.length < MAX_SPORTS_SECTION_GAMES) ids.push(game.id);
  }

  const order = scope ? SCHEDULE_SECTION_TYPES : (catalog?.liveGroupOrder ?? []);
  const sections: SportsSection[] = [];
  let previousIndex = 0;
  let unchanged = true;

  for (let index = 0; index < order.length; index++) {
    const id = order[index];
    const before = previous?.[previousIndex];
    const matchesPrevious = before && (scope ? before.type : before.scopeId) === id;
    if (matchesPrevious) previousIndex += 1;

    const gameIds = groups[id];
    if (!gameIds) continue;

    let section: SportsSection;
    if (matchesPrevious && areArraysEqual(before.gameIds, gameIds)) section = before;
    else section = scope ? { type: SCHEDULE_SECTION_TYPES[index], gameIds } : { type: 'live', scopeId: id, gameIds };

    if (section !== previous?.[sections.length]) unchanged = false;
    sections.push(section);
  }

  return unchanged && previous?.length === sections.length ? previous : sections;
}

// ============ Section Inputs ================================================= //

/**
 * Compares the game fields that can affect browse eligibility or section placement.
 */
export function areSectionFieldsEqual(first: Game | undefined, second: Game | undefined): boolean {
  if (first === second) return true;

  if (first?.status === Game_Status.STATUS_LIVE) {
    return second?.status === Game_Status.STATUS_LIVE && areArraysEqual(first.competitionIds, second.competitionIds);
  }

  if (first?.status === Game_Status.STATUS_SCHEDULED && first.startsAt) {
    return (
      second?.status === Game_Status.STATUS_SCHEDULED &&
      first.startsAt === second.startsAt &&
      areArraysEqual(first.competitionIds, second.competitionIds)
    );
  }

  return second?.status !== Game_Status.STATUS_LIVE && (second?.status !== Game_Status.STATUS_SCHEDULED || !second.startsAt);
}

/**
 * Compares the fields used to group the given games into browse sections.
 */
export function areSectionInputsEqual(
  previous: Partial<Record<string, Game>>,
  next: Partial<Record<string, Game>>,
  gameIds: Iterable<string>
): boolean {
  if (previous === next) return true;
  for (const id of gameIds) if (!areSectionFieldsEqual(previous[id], next[id])) return false;
  return true;
}

// ============ Eligibility ==================================================== //

function isInScope(catalog: SportsCatalog | undefined, scopeId: string, game: Game): boolean {
  return game.competitionIds.some(id => id === scopeId || catalog?.scopes[id]?.parentId === scopeId);
}

function getSectionId(
  catalog: SportsCatalog | undefined,
  game: Game,
  scopeId: string | undefined,
  window: SportsWindow | undefined
): string | undefined {
  if (scopeId && !isInScope(catalog, scopeId, game)) return undefined;
  if (game.status === Game_Status.STATUS_LIVE) return scopeId ? 'live' : getLiveGroupId(catalog, game);

  if (game.status !== Game_Status.STATUS_SCHEDULED || !window || !game.startsAt) return undefined;

  const startsAt = Date.parse(game.startsAt);
  if (!(startsAt >= window.from && startsAt < window.until)) return undefined;
  return startsAt < window.todayUntil ? 'today' : 'upcoming';
}

/**
 * Returns the first matching Live group in catalog order, or the preferred competition.
 */
function getLiveGroupId(catalog: SportsCatalog | undefined, game: Game): string | undefined {
  let group: SportsScope['liveGroup'];

  for (const competitionId of game.competitionIds) {
    const candidate = catalog?.scopes[competitionId]?.liveGroup;
    if (candidate && (!group || candidate.rank < group.rank)) group = candidate;
  }

  return group?.id ?? game.competitionIds[0];
}
