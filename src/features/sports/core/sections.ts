import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';

import { type SportsWindow } from './browse';
import { type SportsCatalog, type SportsScope } from './catalog';
import { Game_Status, type Game } from './generated/sports';

// ============ Types ========================================================== //

/**
 * An ordered group of canonical game IDs. Global Live sections carry a catalog `scopeId`;
 * schedule sections use Live/Today/Upcoming, and Search has one relevance-ordered section.
 * `scopeId` is absent for schedule and Search sections.
 */
export type SportsSection = {
  type: 'live' | 'today' | 'upcoming' | 'search';
  scopeId?: string;
  gameIds: string[];
};

/** A sport or competition and its local schedule window. */
export type SportsBrowseScope = {
  scopeId: string;
  window: SportsWindow;
};

type ScheduleSectionType = 'live' | 'today' | 'upcoming';

// ============ Constants ====================================================== //

/** Maximum displayed games in a browse section or the single Search section. */
export const MAX_SPORTS_SECTION_GAMES = 30;

const SCHEDULE_SECTION_TYPES: readonly ScheduleSectionType[] = ['live', 'today', 'upcoming'];

// ============ Sections ======================================================= //

/**
 * Groups retained canonical games in the order supplied by a browse response, keeping eligible members.
 * Global Live follows catalog group order; a scope returns Live, Today, then Upcoming. Each section is capped at thirty.
 * Reuses unchanged sections and the complete array when given the previous output for the same catalog and destination.
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

  return scope ? buildScheduleSections(groups, previous) : buildLiveSections(catalog, groups, previous);
}

// ============ Section Inputs ================================================= //

/**
 * Compares inputs that can affect browse placement: Live memberships, or scheduled memberships and start time.
 * Games outside those states, including scheduled games without a start, are equally absent from sections.
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
 * Compares the grouping inputs of retained canonical games. Only changes that can affect placement differ;
 * an empty membership is unchanged.
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

// ============ Grouping ======================================================= //

function buildLiveSections(
  catalog: SportsCatalog | undefined,
  groups: Partial<Record<string, string[]>>,
  previous?: SportsSection[]
): SportsSection[] {
  const sections: SportsSection[] = [];
  let previousIndex = 0;
  let unchanged = true;

  for (const scopeId of catalog?.liveGroupOrder ?? []) {
    const before = previous?.[previousIndex];
    const matchesPrevious = before?.scopeId === scopeId;
    if (matchesPrevious) previousIndex += 1;

    const gameIds = groups[scopeId];
    if (!gameIds) continue;

    const section: SportsSection = matchesPrevious && areArraysEqual(before.gameIds, gameIds) ? before : { type: 'live', scopeId, gameIds };
    if (section !== previous?.[sections.length]) unchanged = false;
    sections.push(section);
  }

  return unchanged && previous?.length === sections.length ? previous : sections;
}

function buildScheduleSections(groups: Partial<Record<ScheduleSectionType, string[]>>, previous?: SportsSection[]): SportsSection[] {
  const sections: SportsSection[] = [];
  let previousIndex = 0;
  let unchanged = true;

  for (const type of SCHEDULE_SECTION_TYPES) {
    const before = previous?.[previousIndex];
    const matchesPrevious = before?.type === type;
    if (matchesPrevious) previousIndex += 1;

    const gameIds = groups[type];
    if (!gameIds?.length) continue;

    const section = matchesPrevious && areArraysEqual(before.gameIds, gameIds) ? before : { type, gameIds };
    if (section !== previous?.[sections.length]) unchanged = false;
    sections.push(section);
  }

  return unchanged && previous?.length === sections.length ? previous : sections;
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
