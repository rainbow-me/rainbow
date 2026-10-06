import { createQueryStore, getQueryKey, type CacheEntry, type QueryStoreState, type SetDataParams } from '@storesjs/stores';
import { replaceEqualDeep } from '@tanstack/query-core';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { type SportsDestination, type SportsHost, type SportsWindow } from '@/features/sports/core/browse';
import { buildSportsCatalog, type SportsCatalog } from '@/features/sports/core/catalog';
import {
  type SportsCatalog as CatalogMessage,
  type Game,
  type GetCatalogResponse,
  type GetGamesResponse,
  type LookupGamesResponse,
  type SearchGamesResponse,
} from '@/features/sports/core/generated/sports';
import {
  areSectionFieldsEqual,
  groupSportsGames,
  MAX_SPORTS_SECTION_GAMES,
  type SportsBrowseScope,
  type SportsSection,
} from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import {
  getRequestDestination,
  sportsPageRequestStores,
  sportsRequestStore,
  type SportsPageRequest,
  type SportsRequest,
} from '@/features/sports/data/sportsRequestStore';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { useAppStateStore } from '@/state/appState/appStateStore';

// ============ Types ========================================================== //

/**
 * Shared Sports data and request status.
 */
export type SportsQueryState = QueryStoreState<SportsResponse | null, SportsParams, SportsState>;

type BrowseResponse = ({ type: 'live' } | { type: 'scope'; scopeId: string; window: SportsWindow }) & GetGamesResponse;

type SportsResponse =
  | BrowseResponse
  | ({ type: 'catalog' } & GetCatalogResponse)
  | SportsSearchResponse
  | ({ type: 'event'; eventId: string } & Pick<LookupGamesResponse, 'catalog' | 'catalogRevision' | 'games'>);

/**
 * The full Search result order and newly fetched game data.
 */
type SportsSearchResponse = SearchGamesResponse & {
  type: 'search';
  gameIds: string[];
  minimumGameCount: number;
};

type SportsParams = { request: SportsRequest | null };

/**
 * A browse query's game order and display sections.
 */
type BrowseResult = {
  queryKey: string;
  /**
   * Game IDs in response order, including games currently excluded from display.
   */
  gameIds: ReadonlySet<string>;
  sections: SportsSection[];
  /** The browsed sport or competition; absent for global Live. */
  scope: SportsBrowseScope | undefined;
};

type SearchResult = {
  queryKey: string;
  /** Minimum result count to request across refreshes and retries. */
  minimumGameCount: number;
  gameIds: string[];
  nextCursor?: string;
};

type EventLookup = {
  eventId: string;
  gameId: string | null;
  fetchedAt: number;
};

type SportsData = {
  games: Partial<Record<string, Game>>;
  /** Last successful fetch time for each game, in Unix milliseconds. */
  gameFetchedAt: Partial<Record<string, number>>;
  /** The selected event's lookup result; primary games are read from `games`. */
  lookup: EventLookup | undefined;
  /** Browse results for Live and visited sports or competitions. */
  results: Partial<Record<SportsDestination, BrowseResult>>;
  search: SearchResult | undefined;
};

type SportsState = SportsData & {
  catalog: SportsCatalog | undefined;
};

// ============ Constants ====================================================== //

const STALE_TIME = time.seconds(60);
const RPC_NOT_FOUND = 5;
const RPC_FAILED_PRECONDITION = 9;
const CATALOG_QUERY_KEY = getPageQueryKey({ type: 'catalog' });

// ============ Sports Store =================================================== //

/**
 * Shares the Sports catalog, games, and page results across Sports and Predictions.
 * Refreshes the active screen's data while the app is active.
 */
export const useSportsStore = createQueryStore<SportsResponse | null, SportsParams, SportsState>(
  {
    fetcher: fetchSports,
    setData: setSportsData,
    cacheTime: Infinity,
    enabled: $ => {
      const appActive = $(useAppStateStore, s => s === 'active');
      const hasRequest = $(sportsRequestStore, s => s !== null);
      return appActive && hasRequest;
    },
    staleTime: ($, store) => {
      const request = $(sportsRequestStore, s => s);
      if (request?.type !== 'event') return STALE_TIME;

      const queryFetchedAt = $(store, s => s.queryCache[s.queryKey]?.lastFetchedAt);
      const eventDueAt = $(store, s => getEventDueAt(s, request.eventId));
      return queryFetchedAt ? eventDueAt - queryFetchedAt : STALE_TIME;
    },
    params: { request: $ => $(sportsRequestStore, s => s) },
  },

  () => ({
    catalog: undefined,
    ...getEmptyData(),
  })
);

/**
 * Returns the cache key for a Sports page request.
 */
export function getPageQueryKey(request: SportsPageRequest): string {
  return getQueryKey({ request });
}

// ============ Reads ========================================================== //

/**
 * Finds a cached game ID for a primary or child event.
 * Returns `null` if unavailable, or `undefined` if the event has not been resolved.
 */
export function getGameId(state: Pick<SportsState, 'games' | 'lookup'>, eventId: string): string | null | undefined {
  if (state.lookup?.eventId === eventId) return state.lookup.gameId;
  return state.games[eventId] ? eventId : undefined;
}

// ============ Page Actions =================================================== //

/**
 * Forces a refresh of the screen's current Sports page.
 */
export async function refreshSportsPage(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  if (request) await useSportsStore.getState().fetch({ request }, { force: true });
}

/**
 * Loads more results for the screen's current Search, if available.
 */
export async function loadMoreSportsGames(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  const { fetch, search } = useSportsStore.getState();
  if (request?.type !== 'search' || search?.queryKey !== getPageQueryKey(request) || !search.nextCursor) return;

  const minimumGameCount = search.gameIds.length + 1;
  if (search.minimumGameCount !== minimumGameCount) useSportsStore.setState({ search: { ...search, minimumGameCount } });

  await fetch({ request }, { force: true });
}

/**
 * Retries a Sports page.
 * Returns to Live if the requested sport or competition isn't found.
 */
export async function retrySportsPage(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  if (!request) return;

  const { queryCache } = useSportsStore.getState();
  const queryKey = getPageQueryKey(request);
  const code = getErrorCode(queryCache[queryKey]?.errorInfo?.error);

  if (code === RPC_NOT_FOUND && request.type === 'scope') return sportsNavigationStores[host].getState().select('live');

  await refreshSportsPage(host);
}

// ============ Fetching ======================================================= //

async function fetchSports({ request }: SportsParams, abortController: AbortController | null): Promise<SportsResponse | null> {
  if (!request) return null;

  pruneQueryCache(request);
  const knownCatalogRevision = useSportsStore.getState().catalog?.revision;

  switch (request.type) {
    case 'live':
      return { ...request, ...(await sportsClient.getLiveGames({ knownCatalogRevision }, abortController)) };

    case 'catalog':
      return { ...request, ...(await sportsClient.getCatalog({ knownCatalogRevision }, abortController)) };

    case 'scope':
      return {
        ...request,
        ...(await sportsClient.getGames({ scopeId: request.scopeId, window: request.window, knownCatalogRevision }, abortController)),
      };

    case 'search':
      return fetchSearchResult(request, abortController);

    case 'event': {
      if (getEventDueAt(useSportsStore.getState(), request.eventId) > Date.now()) return null;

      const { catalog, catalogRevision, games } = await sportsClient.lookupGames(
        { eventIds: [request.eventId], knownCatalogRevision },
        abortController
      );
      return { type: 'event', eventId: request.eventId, catalog, catalogRevision, games };
    }
  }
}

/**
 * Loads or refreshes Search results, following continuation pages as needed.
 */
async function fetchSearchResult(
  request: Extract<SportsPageRequest, { type: 'search' }>,
  abortController: AbortController | null
): Promise<SportsSearchResponse> {
  const state = useSportsStore.getState();
  const queryKey = getPageQueryKey(request);
  const previous = state.search?.queryKey === queryKey ? state.search : undefined;
  const entry = state.queryCache[queryKey];
  const canContinue =
    previous &&
    previous.minimumGameCount > previous.gameIds.length &&
    Date.now() - (entry?.lastFetchedAt ?? 0) < STALE_TIME &&
    getErrorCode(entry?.errorInfo?.error) !== RPC_FAILED_PRECONDITION;

  let minimumGameCount = Math.max(previous?.gameIds.length ?? 0, previous?.minimumGameCount ?? 1);
  let cursor = canContinue ? previous.nextCursor : undefined;
  let knownCatalogRevision = state.catalog?.revision;
  let catalog: CatalogMessage | undefined;
  let restarted = false;

  // Existing IDs preserve Search order without redelivering their cached game data.
  const gamesById = new Map<string, Game | undefined>();
  if (cursor && previous) {
    for (const id of previous.gameIds) gamesById.set(id, undefined);
  }

  const { query, window } = request;

  for (;;) {
    let response: SearchGamesResponse;
    try {
      response = await sportsClient.searchGames({ query, window, cursor, knownCatalogRevision }, abortController);
    } catch (error) {
      if (restarted || !cursor || abortController?.signal.aborted || getErrorCode(error) !== RPC_FAILED_PRECONDITION) throw error;

      // A rejected cursor invalidates the whole accumulated range, including its catalog.
      restarted = true;
      cursor = undefined;
      catalog = undefined;
      knownCatalogRevision = useSportsStore.getState().catalog?.revision;
      gamesById.clear();
      continue;
    }

    knownCatalogRevision = response.catalogRevision;
    catalog ??= response.catalog;
    for (const game of response.games) {
      if (gamesById.size === MAX_SPORTS_SECTION_GAMES && !gamesById.has(game.id)) break;
      gamesById.set(game.id, game);
    }

    // A load-more action can extend the target while this request is in flight.
    const current = useSportsStore.getState().search;
    if (current?.queryKey === queryKey) minimumGameCount = Math.max(minimumGameCount, current.minimumGameCount);
    cursor = response.nextCursor;
    if (cursor && gamesById.size < minimumGameCount) continue;

    const gameIds: string[] = [];
    const games: Game[] = [];
    for (const [id, game] of gamesById) {
      gameIds.push(id);
      if (game) games.push(game);
    }

    return {
      type: 'search',
      catalogRevision: response.catalogRevision,
      catalog,
      gameIds,
      minimumGameCount,
      games,
      nextCursor: gameIds.length < MAX_SPORTS_SECTION_GAMES ? cursor : undefined,
    };
  }
}

function getEventDueAt(state: Pick<SportsData, 'gameFetchedAt' | 'lookup'>, eventId: string): number {
  const fetchedAt = state.lookup?.eventId === eventId ? state.lookup.fetchedAt : state.gameFetchedAt[eventId];
  return (fetchedAt ?? 0) + STALE_TIME;
}

// ============ Storing Responses ============================================== //

/**
 * Stores a response, clearing previous data when the catalog revision advances.
 */
function setSportsData({ data: response, queryKey, set }: SetDataParams<SportsResponse | null, SportsParams, SportsState>): void {
  if (!response) return;

  const now = Date.now();

  set(state => {
    const catalog = updateCatalog(state.catalog, response.catalogRevision, response.catalog);
    const isNewCatalog = catalog !== state.catalog;
    const data = mergeSportsResponse(isNewCatalog ? getEmptyData() : state, response, catalog, queryKey, now);
    let queryCache = isNewCatalog ? { [queryKey]: state.queryCache[queryKey] } : state.queryCache;
    let replacedKey: string | undefined;

    if (response.type === 'search') {
      replacedKey = state.search?.queryKey;
    } else if (response.type === 'live' || response.type === 'scope') {
      replacedKey = state.results[getRequestDestination(response)]?.queryKey;
    }

    if (queryKey !== CATALOG_QUERY_KEY) {
      queryCache = setEntry<CacheEntry<SportsResponse | null>>(queryCache, state.queryCache, CATALOG_QUERY_KEY, {
        cacheTime: Infinity,
        data: null,
        errorInfo: null,
        lastFetchedAt: now,
      });
    }

    if (replacedKey && replacedKey !== queryKey && queryCache[replacedKey]) {
      queryCache = setEntry<CacheEntry<SportsResponse | null>>(queryCache, state.queryCache, replacedKey, undefined);
    }

    return { ...data, catalog, queryCache };
  });
}

/**
 * Reuses the current catalog or builds a newer revision.
 * Rejects older revisions and responses missing a required catalog.
 */
function updateCatalog(catalog: SportsCatalog | undefined, revision: number, incoming: CatalogMessage | undefined): SportsCatalog {
  if (catalog && revision < catalog.revision) throw new Error('Sports response uses an older catalog.');
  if (catalog && revision === catalog.revision) return catalog;
  if (!incoming) throw new Error('Sports response is missing its catalog.');
  return buildSportsCatalog(incoming, revision);
}

function getEmptyData(): SportsData {
  return { games: {}, gameFetchedAt: {}, lookup: undefined, results: {}, search: undefined };
}

function mergeSportsResponse(
  previous: SportsData,
  response: SportsResponse,
  catalog: SportsCatalog,
  queryKey: string,
  now: number
): SportsData {
  const selectedEventId = polymarketEventIdStore.getState().eventId;
  let lookup = previous.lookup;
  if (response.type === 'event' && response.eventId === selectedEventId) {
    const gameId = response.games[0]?.id ?? null;
    lookup = gameId === response.eventId ? undefined : { eventId: response.eventId, gameId, fetchedAt: now };
  }

  const incomingGames = response.type === 'catalog' ? [] : response.games;
  let { games, gameFetchedAt } = previous;
  let hasNewGames = false;
  let gameIdsToRegroup: string[] | undefined;

  for (const game of incomingGames) {
    const before = previous.games[game.id];
    const stored = replaceEqualDeep(before, game);

    if (stored !== before) {
      games = setEntry(games, previous.games, game.id, stored);
      if (before && !areSectionFieldsEqual(before, stored)) (gameIdsToRegroup ??= []).push(game.id);
      if (!before) hasNewGames = true;
    }

    gameFetchedAt = setEntry(gameFetchedAt, previous.gameFetchedAt, game.id, now);
    if (lookup?.eventId === game.id && lookup.gameId === null) lookup = undefined;
  }

  let { results, search } = previous;
  let updatedDestination: SportsDestination | undefined;
  let pageMembershipChanged = false;

  if (response.type === 'live' || response.type === 'scope') {
    updatedDestination = getRequestDestination(response);
    const before = results[updatedDestination];
    const result = updateBrowseResult(before, response, catalog, games, queryKey, gameIdsToRegroup !== undefined);

    if (result !== before) results = setEntry(results, previous.results, updatedDestination, result);
    pageMembershipChanged =
      result.gameIds !== before?.gameIds &&
      (result.gameIds.size !== before?.gameIds.size || response.games.some(game => !before.gameIds.has(game.id)));
  } else if (response.type === 'search') {
    const { gameIds, nextCursor, minimumGameCount } = response;
    search = replaceEqualDeep(search, { queryKey, minimumGameCount, gameIds, nextCursor });
  }

  if (gameIdsToRegroup) {
    for (const [destination, result] of Object.entries(results)) {
      if (!result || destination === updatedDestination || !gameIdsToRegroup.some(id => result.gameIds.has(id))) continue;

      const sections = groupSportsGames(catalog, games, result.gameIds, result.scope, result.sections);
      if (sections !== result.sections) results = setEntry(results, previous.results, destination, { ...result, sections });
    }
  }

  const retentionChanged =
    hasNewGames ||
    pageMembershipChanged ||
    search?.gameIds !== previous.search?.gameIds ||
    lookup?.eventId !== previous.lookup?.eventId ||
    lookup?.gameId !== previous.lookup?.gameId;

  return retainSportsData(previous, { games, gameFetchedAt, lookup, results, search }, selectedEventId, retentionChanged);
}

/**
 * Updates a browse result, retaining unchanged section and result references.
 */
function updateBrowseResult(
  previous: BrowseResult | undefined,
  response: BrowseResponse,
  catalog: SportsCatalog,
  games: SportsData['games'],
  queryKey: string,
  groupingChanged: boolean
): BrowseResult {
  const previousIds = previous?.gameIds.values();
  const sameOrder = previous?.gameIds.size === response.games.length && response.games.every(game => game.id === previousIds?.next().value);
  if (previous?.queryKey === queryKey && sameOrder && !groupingChanged) return previous;

  const scope = response.type === 'scope' ? { scopeId: response.scopeId, window: response.window } : undefined;
  const gameIds = previous && sameOrder ? previous.gameIds : new Set(response.games.map(game => game.id));
  const sections = groupSportsGames(catalog, games, gameIds, scope, previous?.sections);

  if (previous?.queryKey === queryKey && gameIds === previous.gameIds && sections === previous.sections) return previous;
  return { queryKey, gameIds, sections, scope };
}

// ============ Retention ====================================================== //

/** The selected event at the last cache cleanup. */
let retainedEventId: string | null | undefined;

/**
 * Removes games no longer referenced by page results or the selected event.
 */
function retainSportsData(previous: SportsData, next: SportsData, selectedEventId: string | null, retentionChanged: boolean): SportsData {
  if (!retentionChanged && retainedEventId === selectedEventId) return next;
  retainedEventId = selectedEventId;

  const { results, search } = next;
  const lookup = next.lookup?.eventId === selectedEventId ? next.lookup : undefined;
  const retainedGameIds = new Set(search?.gameIds);

  for (const result of Object.values(results)) {
    for (const id of result?.gameIds ?? []) retainedGameIds.add(id);
  }
  if (selectedEventId) {
    const gameId = getGameId(next, selectedEventId);
    if (gameId) retainedGameIds.add(gameId);
  }

  let { games, gameFetchedAt } = next;
  for (const gameId of Object.keys(games)) {
    if (retainedGameIds.has(gameId)) continue;
    games = setEntry(games, previous.games, gameId, undefined);
    gameFetchedAt = setEntry(gameFetchedAt, previous.gameFetchedAt, gameId, undefined);
  }

  return { games, gameFetchedAt, lookup, results, search };
}

// ============ Query Cache ==================================================== //

let lastPrunedRequest: SportsRequest | undefined;

/**
 * Removes unused query entries while preserving the catalog, current requests,
 * and stored page results.
 */
function pruneQueryCache(request: SportsRequest): void {
  if (lastPrunedRequest === request) return;

  let recheckPageRequests = false;

  useSportsStore.setState(state => {
    const { results, search, queryCache } = state;
    const ownedKeys = new Set([getQueryKey({ request }), CATALOG_QUERY_KEY]);
    if (search) ownedKeys.add(search.queryKey);

    for (const result of Object.values(results)) {
      if (result) ownedKeys.add(result.queryKey);
    }

    let pageKeys: Set<string> | undefined;
    let kept = queryCache;

    for (const [key, entry] of Object.entries(queryCache)) {
      if (ownedKeys.has(key)) continue;

      if (entry?.lastFetchedAt === null && (pageKeys ??= getPageQueryKeys()).has(key)) {
        recheckPageRequests = true;
        continue;
      }

      if (kept === queryCache) kept = { ...queryCache };
      delete kept[key];
    }

    return kept === queryCache ? state : { queryCache: kept };
  });

  lastPrunedRequest = recheckPageRequests ? undefined : request;
}

function getPageQueryKeys(): Set<string> {
  const pageKeys = new Set<string>();

  for (const store of Object.values(sportsPageRequestStores)) {
    const request = store.getState();
    if (request) pageKeys.add(getPageQueryKey(request));
  }

  return pageKeys;
}

// ============ Utilities ====================================================== //

/**
 * Sets an entry, copying the original record on its first write.
 * Deletes the entry when `value` is `undefined`.
 */
function setEntry<T>(
  record: Partial<Record<string, T>>,
  original: Partial<Record<string, T>>,
  key: string,
  value: T | undefined
): Partial<Record<string, T>> {
  const next = record === original ? { ...original } : record;
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

function getErrorCode(error: unknown): number | undefined {
  const code: unknown = error instanceof RainbowFetchError ? error.responseBody?.code : undefined;
  return typeof code === 'number' ? code : undefined;
}
