import { createQueryStore, getQueryKey, queryParam, type SetDataParams } from '@storesjs/stores';
import { replaceEqualDeep } from '@tanstack/query-core';

import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { buildSportsCatalog, type SportsCatalog } from '@/features/sports/core/catalog';
import {
  type SportsCatalog as CatalogResponse,
  type Game,
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
  | (CatalogRequest & { catalog: CatalogResponse })
  | (ScopeRequest & GetGamesResponse)
  | SportsSearchResponse
  | (EventsRequest & LookupGamesResponse);

type SportsSearchResponse = SearchRequest & SearchGamesResponse & { gameIds: string[] };

type SportsParams = { request: SportsRequest | null };

/** Owns its query-cache entry until replaced. `scope` preserves the window used to select its sections. */
type SportsResult = {
  queryKey: string;
  /** Response membership survives a Game temporarily leaving its sections. */
  gameIds: ReadonlySet<string>;
  sections: SportsSection[];
  scope: SportsGamesScope | undefined;
};

type SearchResult = {
  queryKey: string;
  /** Minimum result count requested, including a pending or failed load-more. */
  requestedCount: number;
  gameIds: string[];
  nextCursor?: string;
};

type SportsState = {
  catalog: SportsCatalog | undefined;
  games: Partial<Record<string, Game>>;
  /** Explicit event resolutions; `null` means the event is not a sports game. */
  eventGameIds: Partial<Record<string, string | null>>;
  /** Last successful lookup of an event, or delivery of the Game with that event's ID. */
  answeredAt: Map<string, number>;
  /** Results for Live and visited scopes. */
  results: Partial<Record<SportsDestination, SportsResult>>;
  search: SearchResult | undefined;
};

type SportsData = Omit<SportsState, 'catalog'>;

// ============ Constants ====================================================== //

const FRESH_FOR = time.seconds(60);
const RPC_NOT_FOUND = 5;
const RPC_FAILED_PRECONDITION = 9;
const CATALOG_QUERY_KEY = getPageQueryKey({ type: 'catalog' });

// ============ Sports Store =================================================== //

/**
 * Games, page results, and event resolutions shared by Sports and Discover, fresh for a minute.
 * Keeps Games referenced by page or Search results, mounted Discover lists, or the selected event.
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

  () => ({ catalog: undefined, ...getEmptyData() })
);

/**
 * The cache key of a page request, built as the store builds it.
 */
export function getPageQueryKey(request: SportsPageRequest): string {
  return getQueryKey({ request: getRequestKey(request) });
}

// ============ Reads ========================================================== //

/**
 * An event's game ID: `null` when the event is not a sports game, and `undefined` until known. A game's ID is
 * its primary event's ID.
 */
export function getGameId(state: Pick<SportsState, 'games' | 'eventGameIds'>, eventId: string): string | null | undefined {
  const gameId = state.eventGameIds[eventId];
  if (gameId !== undefined) return gameId;
  return state.games[eventId] ? eventId : undefined;
}

/**
 * The stored game an event resolves to: `undefined` until it resolves, and for an event that is not a sports game.
 */
export function getGame(state: Pick<SportsState, 'games' | 'eventGameIds'>, eventId: string): Game | undefined {
  const gameId = getGameId(state, eventId);
  return gameId ? state.games[gameId] : undefined;
}

/**
 * Selects stored Games by their primary IDs.
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
 * Fetches a host's page again, even while another request is active.
 */
export async function refreshSportsPage(host: SportsHost): Promise<void> {
  const request = sportsPageRequestStores[host].getState();
  if (request) await useSportsStore.getState().fetch({ request }, { force: true });
}

/**
 * Refreshes the active events, including answers that are still fresh.
 */
export async function refreshSportsEvents(): Promise<void> {
  const request = sportsRequestStore.getState();
  if (request?.type !== 'events' || !useSportsStore.getState().enabled) return;

  useSportsStore.setState(state => {
    let answeredAt = state.answeredAt;

    for (const id of request.eventIds) {
      if (answeredAt.has(id)) answeredAt = setMapEntry(answeredAt, state.answeredAt, id, undefined);
    }

    return answeredAt === state.answeredAt ? state : { answeredAt };
  });

  await useSportsStore.getState().fetch({ request }, { force: true });
}

/**
 * Loads the next page of a host's Search. Only the result for the current query and week continues.
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
 * Retries a host's failed page, preserving its requested Search range. A removed scope returns to Live.
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

  switch (request.type) {
    case 'live':
      return { ...request, ...(await sportsClient.getLiveGames({}, abortController)) };

    case 'catalog':
      return { ...request, catalog: await sportsClient.getCatalog(abortController) };

    case 'scope':
      return { ...request, ...(await fetchScope(request, abortController)) };

    case 'search':
      return fetchSearch(request, abortController);

    case 'events': {
      const eventIds = getDueEventIds(useSportsStore.getState().answeredAt, request.eventIds);
      return eventIds.length ? { ...request, ...(await sportsClient.lookupGames({ eventIds }, abortController)) } : null;
    }
  }
}

/**
 * Live games for a sport browsed by competition, and the week's games for any other scope.
 */
async function fetchScope({ scopeId, window }: ScopeRequest, abortController: AbortController | null): Promise<GetGamesResponse> {
  const catalog = useSportsStore.getState().catalog ?? buildSportsCatalog(await sportsClient.getCatalog(abortController));
  if (catalog.scopes[scopeId]?.directoryIds) return sportsClient.getLiveGames({ scopeId }, abortController);

  return sportsClient.getGames({ scopeId, ...window }, abortController);
}

async function fetchSearch(request: SearchRequest, abortController: AbortController | null): Promise<SportsSearchResponse> {
  const { search, queryCache } = useSportsStore.getState();
  const queryKey = getPageQueryKey(request);
  const previous = search?.queryKey === queryKey ? search : undefined;
  const entry = queryCache[queryKey];
  const canContinue =
    previous &&
    previous.requestedCount > previous.gameIds.length &&
    Date.now() - (entry?.lastFetchedAt ?? 0) < FRESH_FOR &&
    getErrorCode(entry?.errorInfo?.error) !== RPC_FAILED_PRECONDITION;

  let cursor = canContinue ? previous.nextCursor : undefined;
  let requestedCount = Math.max(previous?.gameIds.length ?? 0, previous?.requestedCount ?? 1);
  let response: SearchGamesResponse;
  let requestedCursors: Set<string> | undefined;
  const gameIds = new Set(cursor ? previous?.gameIds : undefined);
  const games: Game[] = [];

  do {
    if (cursor) (requestedCursors ??= new Set()).add(cursor);
    response = await sportsClient.searchGames({ query: request.query, ...request.window, cursor }, abortController);

    if (response.nextCursor && requestedCursors?.has(response.nextCursor)) {
      throw new Error('Sports Search returned a repeated cursor');
    }

    for (const game of response.games) {
      if (gameIds.size === MAX_SPORTS_SECTION_GAMES && !gameIds.has(game.id)) break;
      gameIds.add(game.id);
      games.push(game);
    }

    const current = useSportsStore.getState().search;
    if (current?.queryKey === queryKey) requestedCount = Math.max(requestedCount, current.requestedCount);
    cursor = response.nextCursor;
  } while (cursor && gameIds.size < requestedCount);

  return {
    ...request,
    catalog: response.catalog,
    gameIds: [...gameIds],
    games,
    nextCursor: gameIds.size < MAX_SPORTS_SECTION_GAMES ? cursor : undefined,
  };
}

function getRequestKey(request: SportsRequest | null): SportsPageRequest | Omit<EventsRequest, 'eventIds'> | null {
  return request?.type === 'events' ? { type: 'events', route: request.route } : request;
}

// ============ Event Freshness ================================================ //

/**
 * The events the store holds no answer for, or whose answer is a minute old.
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
 * When an event needs asking again: at once without an answer, then a minute after the server last answered for it.
 */
function getEventDueAt(answeredAt: Map<string, number>, eventId: string): number {
  return (answeredAt.get(eventId) ?? 0) + FRESH_FOR;
}

// ============ Storing Responses ============================================== //

/**
 * Stores a response. A response from a new catalog revision replaces everything stored before it, along with
 * its freshness.
 */
function setSportsData({ data: response, queryKey, set }: SetDataParams<SportsResponse | null, SportsParams, SportsState>): void {
  if (!response) return;

  const now = Date.now();

  set(state => {
    const catalog = updateCatalog(state.catalog, response.catalog);
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
  catalog: SportsCatalog | undefined,
  queryKey: string,
  now: number
): SportsData {
  let { games, eventGameIds, answeredAt, results, search } = data;
  let shown: readonly Game[] = [];
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

      if (unchanged) {
        shown = response.games;
        break;
      }

      const scope = response.type === 'scope' ? { scopeId: response.scopeId, window: response.window } : undefined;
      const selection = groupSportsGames(catalog, response.games, scope);
      shown = selection.games;

      const gameIds =
        previous?.gameIds.size === shown.length && shown.every(game => previous.gameIds.has(game.id))
          ? previous.gameIds
          : new Set(shown.map(game => game.id));
      const sections = reuseSections(previous?.sections, selection.sections);
      membershipChanged = gameIds !== previous?.gameIds;

      if (previous?.queryKey !== queryKey || membershipChanged || sections !== previous.sections) {
        results = { ...results, [updatedPage]: { queryKey, gameIds, sections, scope } };
      }
      break;
    }

    case 'search': {
      const { gameIds, nextCursor } = response;
      const requestedCount = search?.queryKey === queryKey ? search.requestedCount : 1;
      shown = response.games;
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

      shown = response.games;
      for (const { eventId, gameId } of response.resolved) resolve(eventId, gameId);
      for (const eventId of response.unavailableEventIds) resolve(eventId, null);
      break;
    }

    case 'catalog':
      break;
  }

  let sectionChanges: string[] | undefined;

  for (const game of shown) {
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

      const selection = selectSportsGames(catalog, getGames(games, result.gameIds), result.scope);
      const sections = reuseSections(result.sections, selection.sections);
      if (sections !== result.sections) results = setEntry(results, data.results, destination, { ...result, sections });
    }
  }

  const rootsChanged = membershipChanged || search?.gameIds !== data.search?.gameIds || eventGameIds !== data.eventGameIds;
  return retainSportsData({ games, eventGameIds, answeredAt, results, search }, rootsChanged);
}

// ============ Retention ====================================================== //

/** External owners last checked by retention; response-owned membership is compared in the merge. */
let retainedRoots: { listIds: ReadonlySet<string>; selectedId: string | null } | undefined;

/**
 * Collects unreferenced games and answers after page results, event resolutions, mounted lists, or the selected event change.
 */
function retainSportsData(data: SportsData, rootsChanged: boolean): SportsData {
  const listIds = discoverEventListsStore.getState().mountedEventIds;
  const selectedId = polymarketEventIdStore.getState().eventId;
  if (!rootsChanged && retainedRoots?.listIds === listIds && retainedRoots.selectedId === selectedId) return data;

  retainedRoots = { listIds, selectedId };
  const { results, search } = data;

  const gameIds = new Set(search?.gameIds);
  for (const result of Object.values(results)) {
    for (const id of result?.gameIds ?? []) gameIds.add(id);
  }

  for (const eventId of listIds) {
    const gameId = getGameId(data, eventId);
    if (gameId) gameIds.add(gameId);
  }

  if (selectedId) {
    const gameId = getGameId(data, selectedId);
    if (gameId) gameIds.add(gameId);
  }

  let { games, eventGameIds, answeredAt } = data;

  for (const eventId of Object.keys(eventGameIds)) {
    if (eventId === selectedId || listIds.has(eventId)) continue;

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

/** A hidden page's failed key can change while the active request stays the same, so its ownership must be rechecked. */
let lastPrune: { request: SportsRequest; keptPageFailure: boolean } | undefined;

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
 * Keeps the current catalog unless the response carries a newer revision. An older revision fails the response.
 */
function updateCatalog(catalog: SportsCatalog | undefined, incoming: CatalogResponse | undefined): SportsCatalog | undefined {
  if (!incoming || incoming.revision === catalog?.revision) return catalog;
  if (catalog && incoming.revision < catalog.revision) throw new Error('Sports response uses an older catalog.');
  return buildSportsCatalog(incoming);
}

/**
 * Sets `key` in `record`, copying `original` on its first change so an unchanged record keeps its identity.
 * `undefined` removes the key.
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
 * Sets `key` in `map`, copying `original` on its first change. `undefined` removes the key.
 */
function setMapEntry<T>(map: Map<string, T>, original: Map<string, T>, key: string, value: T | undefined): Map<string, T> {
  const next = map === original ? new Map(original) : map;
  if (value === undefined) next.delete(key);
  else next.set(key, value);
  return next;
}

function getErrorCode(error: Error | undefined): number | undefined {
  const code: unknown = error instanceof RainbowFetchError ? error.responseBody?.code : undefined;
  return typeof code === 'number' ? code : undefined;
}
