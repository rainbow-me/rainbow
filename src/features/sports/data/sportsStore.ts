import { createQueryStore, getQueryKey, queryParam, type SetDataParams } from '@storesjs/stores';
import { replaceEqualDeep } from '@tanstack/query-core';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
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
  reuseSections,
  selectSportsGames,
  type SportsGamesScope,
  type SportsSection,
} from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import {
  getRequestDestination,
  sportsPageRequestStores,
  sportsRequestStore,
  type CatalogRequest,
  type EventsRequest,
  type LiveRequest,
  type ScopeRequest,
  type SearchRequest,
  type SportsPageRequest,
  type SportsRequest,
} from '@/features/sports/data/sportsRequestStore';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { useAppStateStore } from '@/state/appState/appStateStore';

// ============ Types ========================================================== //

type SportsResponse =
  | (LiveRequest & GetGamesResponse)
  | (CatalogRequest & GetCatalogResponse)
  | (ScopeRequest & GetGamesResponse)
  | SportsSearchResponse
  | (EventsRequest & LookupGamesResponse);

type SportsSearchResponse = SearchRequest &
  SearchGamesResponse & {
    gameIds: string[];
    requestedCount: number;
  };

type SportsParams = { request: SportsRequest | null };

/** The game IDs and sections kept from a page response. Its query-cache entry stays until the result is replaced. */
type SportsResult = {
  queryKey: string;
  /** Games retained from the response, including any that later leave the displayed sections. */
  gameIds: ReadonlySet<string>;
  sections: SportsSection[];
  /** The sport or competition and date range used to group these sections; absent for Live. */
  scope: SportsGamesScope | undefined;
};

type SearchResult = {
  queryKey: string;
  /** Minimum number of results to load, including a pending or failed load-more request. */
  requestedCount: number;
  gameIds: string[];
  nextCursor?: string;
};

type SportsData = {
  games: Partial<Record<string, Game>>;
  /** Each looked-up event's game ID, or `null` if the lookup found no game. */
  eventGameIds: Partial<Record<string, string | null>>;
  /** When each event was last looked up successfully. A returned game also updates its primary event's timestamp. */
  answeredAt: Map<string, number>;
  /** Results for Live and visited scopes. */
  results: Partial<Record<SportsDestination, SportsResult>>;
  search: SearchResult | undefined;
};

type SportsState = SportsData & {
  catalog: SportsCatalog | undefined;
  getGame: (eventId: string) => Game | undefined;
};

// ============ Constants ====================================================== //

const FRESH_FOR = time.seconds(60);
const RPC_NOT_FOUND = 5;
const RPC_FAILED_PRECONDITION = 9;
const CATALOG_QUERY_KEY = getPageQueryKey({ type: 'catalog' });

// ============ Sports Store =================================================== //

/**
 * Games, page results, and event lookups shared by Sports and Predictions.
 * While the app is active, the current page refreshes every minute. Event lookups stay fresh for a minute.
 */
export const useSportsStore = createQueryStore<SportsResponse | null, SportsParams, SportsState, SportsResponse | null>(
  {
    fetcher: fetchSports,
    setData: setSportsData,
    cacheTime: Infinity,
    enabled: $ => {
      const appActive = $(useAppStateStore, state => state === 'active');
      const hasRequest = $(sportsRequestStore, request => request !== null);
      return appActive && hasRequest;
    },
    staleTime: ($, store) => {
      const request = $(sportsRequestStore, current => current);
      const fetchedAt = $(store, state => state.queryCache[state.queryKey]?.lastFetchedAt);
      const answeredAt = $(store, state => state.answeredAt);

      if (request?.type !== 'events' || !fetchedAt) return FRESH_FOR;
      return getEventsDueAt(answeredAt, request.eventIds) - fetchedAt;
    },
    params: {
      request: queryParam($ => $(sportsRequestStore, request => request), { key: getRequestKey }),
    },
  },

  (_, get) => ({
    catalog: undefined,
    ...getEmptyData(),

    getGame: eventId => {
      const state = get();
      const gameId = getGameId(state, eventId);
      return gameId ? state.games[gameId] : undefined;
    },
  })
);

/**
 * The query-cache key for a Sports page request.
 */
export function getPageQueryKey(request: SportsPageRequest): string {
  return getQueryKey({ request: getRequestKey(request) });
}

// ============ Reads ========================================================== //

/**
 * An event's stored game ID: `null` if a lookup found no game, or `undefined` until known.
 * A game shares its ID with its primary event.
 */
export function getGameId(state: Pick<SportsState, 'games' | 'eventGameIds'>, eventId: string): string | null | undefined {
  const gameId = state.eventGameIds[eventId];
  if (gameId !== undefined) return gameId;
  return state.games[eventId] ? eventId : undefined;
}

/**
 * Returns the stored games for the given game IDs, in order, skipping any that are missing.
 */
export function getGames(games: SportsState['games'], gameIds: Iterable<string>): Game[] {
  const selected: Game[] = [];

  for (const id of gameIds) {
    const game = games[id];
    if (game) selected.push(game);
  }

  return selected;
}

// ============ Page Actions =================================================== //

/**
 * Refetches the Sports or Predictions page, even while another request is active.
 */
export async function refreshSportsPage(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  if (request) await useSportsStore.getState().fetch({ request }, { force: true });
}

/**
 * Loads more Search results for Sports or Predictions. Continues only the current query and date range.
 */
export async function loadMoreSportsGames(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  const { fetch, search } = useSportsStore.getState();
  if (request?.type !== 'search' || search?.queryKey !== getPageQueryKey(request) || !search.nextCursor) return;

  const requestedCount = search.gameIds.length + 1;
  if (search.requestedCount !== requestedCount) useSportsStore.setState({ search: { ...search, requestedCount } });

  await fetch({ request }, { force: true });
}

/**
 * Retries a failed page request, preserving the number of Search results requested.
 * Returns to Live if the sport or competition no longer exists.
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
        ...(await sportsClient.getGames({ scopeId: request.scopeId, ...request.window, knownCatalogRevision }, abortController)),
      };

    case 'search':
      return fetchSearch(request, abortController);

    case 'events': {
      const eventIds = getDueEventIds(useSportsStore.getState().answeredAt, request.eventIds);
      return eventIds.length
        ? { ...request, ...(await sportsClient.lookupGames({ eventIds, knownCatalogRevision }, abortController)) }
        : null;
    }
  }
}

async function fetchSearch(request: SearchRequest, abortController: AbortController | null): Promise<SportsSearchResponse> {
  const state = useSportsStore.getState();
  const { from, until } = request.window;
  const queryKey = getPageQueryKey(request);
  const previous = state.search?.queryKey === queryKey ? state.search : undefined;
  const entry = state.queryCache[queryKey];
  const canContinue =
    previous &&
    previous.requestedCount > previous.gameIds.length &&
    Date.now() - (entry?.lastFetchedAt ?? 0) < FRESH_FOR &&
    getErrorCode(entry?.errorInfo?.error) !== RPC_FAILED_PRECONDITION;

  let cursor = canContinue ? previous.nextCursor : undefined;
  let requestedCount = Math.min(MAX_SPORTS_SECTION_GAMES, Math.max(previous?.gameIds.length ?? 0, previous?.requestedCount ?? 1));
  let knownCatalogRevision = state.catalog?.revision;
  let catalog: CatalogMessage | undefined;
  let restarted = false;
  let requestedCursors: Set<string> | undefined;
  const gameIds = new Set(cursor ? previous?.gameIds : undefined);
  const games = new Map<string, Game>();

  for (;;) {
    if (cursor) (requestedCursors ??= new Set()).add(cursor);
    let response: SearchGamesResponse;

    try {
      response = await sportsClient.searchGames({ query: request.query, from, until, cursor, knownCatalogRevision }, abortController);
    } catch (error) {
      if (!cursor || restarted || abortController?.signal.aborted || getErrorCode(error) !== RPC_FAILED_PRECONDITION) throw error;

      restarted = true;
      cursor = undefined;
      knownCatalogRevision = useSportsStore.getState().catalog?.revision;
      catalog = undefined;
      gameIds.clear();
      games.clear();
      requestedCursors = undefined;
      continue;
    }

    if (cursor && response.catalogRevision !== knownCatalogRevision)
      throw new Error('Sports Search changed catalog revision between pages.');
    if (response.nextCursor && requestedCursors?.has(response.nextCursor)) throw new Error('Sports Search returned a repeated cursor');

    knownCatalogRevision = response.catalogRevision;
    catalog ??= response.catalog;
    for (const game of response.games) {
      if (gameIds.size === MAX_SPORTS_SECTION_GAMES && !gameIds.has(game.id)) break;
      gameIds.add(game.id);
      games.set(game.id, game);
    }

    const current = useSportsStore.getState().search;
    if (current?.queryKey === queryKey)
      requestedCount = Math.min(MAX_SPORTS_SECTION_GAMES, Math.max(requestedCount, current.requestedCount));
    cursor = response.nextCursor;
    if (cursor && gameIds.size < requestedCount) continue;

    return {
      ...request,
      catalogRevision: response.catalogRevision,
      catalog,
      gameIds: [...gameIds],
      requestedCount,
      games: [...games.values()],
      nextCursor: gameIds.size < MAX_SPORTS_SECTION_GAMES ? cursor : undefined,
    };
  }
}

function getRequestKey(request: SportsRequest | null): SportsPageRequest | Omit<EventsRequest, 'eventIds'> | null {
  if (request?.type === 'search') {
    const { from, until } = request.window;
    return { type: 'search', query: request.query, window: { from, until } };
  }
  return request?.type === 'events' ? { type: 'events', route: request.route } : request;
}

// ============ Event Freshness ================================================ //

/**
 * The requested events with missing or expired lookup data.
 */
function getDueEventIds(answeredAt: Map<string, number>, eventIds: readonly string[]): string[] {
  const now = Date.now();
  return eventIds.filter(id => getEventDueAt(answeredAt, id) <= now);
}

function getEventsDueAt(answeredAt: Map<string, number>, eventIds: readonly string[]): number {
  let dueAt = Infinity;
  for (const id of eventIds) dueAt = Math.min(dueAt, getEventDueAt(answeredAt, id));
  return dueAt;
}

/**
 * When an event's lookup expires. Events without a stored timestamp are already due.
 */
function getEventDueAt(answeredAt: Map<string, number>, eventId: string): number {
  return (answeredAt.get(eventId) ?? 0) + FRESH_FOR;
}

// ============ Storing Responses ============================================== //

/**
 * Stores a response, clearing previous data and query-cache entries when a newer catalog revision arrives.
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

    if (replacedKey && replacedKey !== queryKey && queryCache[replacedKey]) {
      queryCache = { ...queryCache };
      delete queryCache[replacedKey];
    }

    return { ...data, catalog, queryCache };
  });
}

function mergeSportsResponse(
  data: SportsData,
  response: SportsResponse,
  catalog: SportsCatalog,
  queryKey: string,
  now: number
): SportsData {
  let { games, eventGameIds, answeredAt, results, search } = data;
  const incomingGames: readonly Game[] = response.type === 'catalog' ? [] : response.games;
  let updatedPage: SportsDestination | undefined;
  let membershipChanged = false;

  switch (response.type) {
    case 'live':
    case 'scope': {
      updatedPage = getRequestDestination(response);
      const previous = results[updatedPage];
      const unchanged =
        previous?.queryKey === queryKey &&
        previous.gameIds.size === response.games.length &&
        response.games.every(game => previous.gameIds.has(game.id) && areSectionFieldsEqual(data.games[game.id], game));

      if (unchanged) break;

      const scope = response.type === 'scope' ? { scopeId: response.scopeId, window: response.window } : undefined;

      const gameIds =
        previous?.gameIds.size === incomingGames.length && incomingGames.every(game => previous.gameIds.has(game.id))
          ? previous.gameIds
          : new Set(incomingGames.map(game => game.id));
      const sections = reuseSections(previous?.sections, groupSportsGames(catalog, incomingGames, scope));
      membershipChanged = gameIds !== previous?.gameIds;

      if (previous?.queryKey !== queryKey || membershipChanged || sections !== previous.sections) {
        results = { ...results, [updatedPage]: { queryKey, gameIds, sections, scope } };
      }
      break;
    }

    case 'search': {
      const { gameIds, nextCursor, requestedCount } = response;
      search = replaceEqualDeep(search, { queryKey, requestedCount, gameIds, nextCursor });
      break;
    }

    case 'events': {
      const resolve = (eventId: string, gameId: string | null): void => {
        answeredAt = setMapEntry(answeredAt, data.answeredAt, eventId, now);

        const previous = eventGameIds[eventId];
        if (previous === gameId) return;
        eventGameIds = setEntry(eventGameIds, data.eventGameIds, eventId, gameId);
      };

      for (const { eventId, gameId } of response.resolved) resolve(eventId, gameId);
      for (const eventId of response.unavailableEventIds) resolve(eventId, null);
      break;
    }

    case 'catalog':
      break;
  }

  let sectionChanges: string[] | undefined;

  for (const game of incomingGames) {
    const previous = data.games[game.id];
    const stored = replaceEqualDeep(previous, game);
    if (stored !== previous) {
      games = setEntry(games, data.games, game.id, stored);
      if (previous && !areSectionFieldsEqual(previous, stored)) (sectionChanges ??= []).push(game.id);
    }
    if (eventGameIds[game.id] === null) eventGameIds = setEntry(eventGameIds, data.eventGameIds, game.id, game.id);
    answeredAt = setMapEntry(answeredAt, data.answeredAt, game.id, now);
  }

  if (sectionChanges) {
    for (const [destination, result] of Object.entries(results)) {
      if (!result || destination === updatedPage || !sectionChanges.some(id => result.gameIds.has(id))) continue;

      const sections = reuseSections(result.sections, selectSportsGames(catalog, getGames(games, result.gameIds), result.scope));
      if (sections !== result.sections) results = setEntry(results, data.results, destination, { ...result, sections });
    }
  }

  const rootsChanged = membershipChanged || search?.gameIds !== data.search?.gameIds || eventGameIds !== data.eventGameIds;
  return retainSportsData({ games, eventGameIds, answeredAt, results, search }, rootsChanged);
}

// ============ Retention ====================================================== //

/** The selected event at the last cleanup of unused data. */
let retainedEventId: string | null | undefined;

/**
 * Removes games and event lookups no longer needed by cached pages, Search, or the selected event.
 */
function retainSportsData(data: SportsData, rootsChanged: boolean): SportsData {
  const selectedId = polymarketEventIdStore.getState().eventId;
  if (!rootsChanged && retainedEventId === selectedId) return data;

  retainedEventId = selectedId;
  const { results, search } = data;

  const gameIds = new Set(search?.gameIds);
  for (const result of Object.values(results)) {
    for (const id of result?.gameIds ?? []) gameIds.add(id);
  }

  if (selectedId) {
    const gameId = getGameId(data, selectedId);
    if (gameId) gameIds.add(gameId);
  }

  let { games, eventGameIds, answeredAt } = data;

  for (const eventId of Object.keys(eventGameIds)) {
    if (eventId === selectedId) continue;

    eventGameIds = setEntry(eventGameIds, data.eventGameIds, eventId, undefined);
    if (!gameIds.has(eventId)) answeredAt = setMapEntry(answeredAt, data.answeredAt, eventId, undefined);
  }

  for (const gameId of Object.keys(games)) {
    if (gameIds.has(gameId)) continue;

    games = setEntry(games, data.games, gameId, undefined);
    if (eventGameIds[gameId] === undefined) answeredAt = setMapEntry(answeredAt, data.answeredAt, gameId, undefined);
  }

  return { games, eventGameIds, answeredAt, results, search };
}

// ============ Query Cache ==================================================== //

/**
 * The last cache cleanup. A retained page failure is rechecked on each fetch because its date range can change at midnight.
 */
let lastPrune: { request: SportsRequest; keptPageFailure: boolean } | undefined;

/**
 * Removes unused query-cache entries, keeping the current request, catalog, and stored page results.
 * Pending or failed requests for the pages' current destinations and date ranges are also kept.
 */
function pruneQueryCache(request: SportsRequest): void {
  if (lastPrune?.request === request && !lastPrune.keptPageFailure) return;

  let keptPageFailure = false;

  useSportsStore.setState(state => {
    const { results, search, queryCache } = state;
    const ownedKeys = new Set([getQueryKey({ request: getRequestKey(request) }), CATALOG_QUERY_KEY]);
    if (search) ownedKeys.add(search.queryKey);

    for (const result of Object.values(results)) {
      if (result) ownedKeys.add(result.queryKey);
    }

    let pageKeys: Set<string> | undefined;
    let kept = queryCache;

    for (const [key, entry] of Object.entries(queryCache)) {
      if (ownedKeys.has(key)) continue;

      if (entry?.lastFetchedAt === null && (pageKeys ??= getPageQueryKeys()).has(key)) {
        keptPageFailure = true;
        continue;
      }

      if (kept === queryCache) kept = { ...queryCache };
      delete kept[key];
    }

    return kept === queryCache ? state : { queryCache: kept };
  });

  lastPrune = { request, keptPageFailure };
}

// ============ Helpers ======================================================== //

function getEmptyData(): SportsData {
  return { games: {}, eventGameIds: {}, answeredAt: new Map(), results: {}, search: undefined };
}

function getPageQueryKeys(): Set<string> {
  const pageKeys = new Set<string>();

  for (const store of Object.values(sportsPageRequestStores)) {
    const request = store.getState();
    if (request) pageKeys.add(getPageQueryKey(request));
  }

  return pageKeys;
}

/**
 * Keeps an equal revision's catalog and requires a catalog for the first or a newer revision.
 * Throws before storing any response data if its revision is older or its required catalog is missing.
 */
function updateCatalog(catalog: SportsCatalog | undefined, revision: number, incoming: CatalogMessage | undefined): SportsCatalog {
  if (catalog && revision < catalog.revision) throw new Error('Sports response uses an older catalog.');
  if (catalog && revision === catalog.revision) return catalog;
  if (!incoming) throw new Error('Sports response is missing its catalog.');
  return buildSportsCatalog(incoming, revision);
}

/**
 * Sets or deletes a record entry, copying the original record before the first write. `undefined` deletes the entry.
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

/**
 * Sets or deletes a map entry, copying the original map before the first write. `undefined` deletes the entry.
 */
function setMapEntry<T>(map: Map<string, T>, original: Map<string, T>, key: string, value: T | undefined): Map<string, T> {
  const next = map === original ? new Map(original) : map;
  if (value === undefined) next.delete(key);
  else next.set(key, value);
  return next;
}

function getErrorCode(error: unknown): number | undefined {
  const code: unknown = error instanceof RainbowFetchError ? error.responseBody?.code : undefined;
  return typeof code === 'number' ? code : undefined;
}
