import {
  createBaseStore,
  createDerivedStore,
  createQueryStore,
  createStoreActions,
  deepEqual,
  getQueryKey,
  queryParam,
  shallowEqual,
  type DeriveGetter,
  type SetDataParams,
} from '@storesjs/stores';
import { replaceEqualDeep } from '@tanstack/query-core';

import {
  getSportsBackDestination,
  getSportsDestinationKey,
  getSportsWindow,
  hasCompetitionDirectory,
  type SportsDestination,
  type SportsHost,
  type SportsWindow,
} from '@/features/sports/core/browse';
import { buildSportsCatalog, type SportsCatalog } from '@/features/sports/core/catalog';
import {
  type Game,
  type GetGamesResponse,
  type LookupGamesResponse,
  type SearchGamesResponse,
} from '@/features/sports/core/generated/sports';
import { getSportsDirectoryCounts, getSportsSections, MAX_SPORTS_SECTION_GAMES, type SportsSection } from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import Routes, { type Route } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ View State ==================================================== //

type BrowseRequest = { destination: SportsDestination; query: string | null };
type HostState = { request: BrowseRequest; category: SportsDestination; visible: boolean };
type LookupConsumer = { route: Route; eventIds: string[]; visibleIds: string[]; active: boolean };

type QuoteConsumer = { active: boolean; renderedGameIds: string[]; visibleGameIds: string[] };

type SportsViewState = {
  appActive: boolean;
  window: SportsWindow;
  hosts: Record<SportsHost, HostState>;
  quoteConsumers: Map<symbol, QuoteConsumer>;
  lookupConsumers: Map<symbol, LookupConsumer>;
  setHostVisibility: (host: SportsHost, visible: boolean) => void;
  selectDestination: (host: SportsHost, destination: SportsDestination) => void;
  openScope: (host: SportsHost, scopeId: string) => void;
  goBack: (host: SportsHost) => void;
  setSearch: (host: SportsHost, query: string | null) => void;
  loadMore: (host: SportsHost) => Promise<void>;
  refresh: (host: SportsHost) => Promise<void>;
  retry: (host: SportsHost) => Promise<void>;
  updateWindow: (now?: Date) => void;
  setQuoteConsumer: (owner: symbol, consumer: Pick<QuoteConsumer, 'active' | 'renderedGameIds'>) => void;
  setVisibleQuoteGames: (owner: symbol, visibleGameIds: string[]) => void;
  removeQuoteConsumer: (owner: symbol) => void;
  setLookupConsumer: (owner: symbol, consumer: Omit<LookupConsumer, 'visibleIds'> & { visibleIds?: string[] }) => void;
  setVisibleLookupEvents: (owner: symbol, visibleIds: string[]) => void;
  removeLookupConsumer: (owner: symbol) => void;
};

function initialHost(): HostState {
  return { request: { destination: { type: 'live' }, query: null }, category: { type: 'live' }, visible: false };
}

export const useSportsViewStore = createBaseStore<SportsViewState>((set, get) => ({
  appActive: false,
  hosts: { main: initialHost(), predictions: initialHost() },
  window: getSportsWindow(),
  lookupConsumers: new Map(),
  quoteConsumers: new Map(),

  setHostVisibility: (host, visible) =>
    set(state => {
      const current = state.hosts[host];
      return current.visible === visible ? state : { hosts: { ...state.hosts, [host]: { ...current, visible } } };
    }),

  selectDestination: (host, destination) => setBrowseRequest(host, { destination, query: null }, destination),

  openScope: (host, scopeId) => {
    const { request, category } = get().hosts[host];
    const destination: SportsDestination = { type: 'scope', scopeId };
    setBrowseRequest(host, { destination, query: null }, request.query === null ? category : destination);
  },

  goBack: host => {
    const { request, category } = get().hosts[host];
    const destination = getSportsBackDestination(useSportsStore.getState().catalog, request.destination, category);
    if (destination) setBrowseRequest(host, { destination, query: null });
  },

  setSearch: (host, query) => {
    const request = get().hosts[host].request;
    const text = query === null ? null : query.trim();
    if (text !== request.query) setBrowseRequest(host, { destination: request.destination, query: text });
  },

  loadMore: async host => {
    const { request } = get().hosts[host];
    const data = useSportsStore.getState();
    const cursor = getSportsResult(data, request)?.nextCursor;
    if (!get().appActive || !get().hosts[host].visible || !request.query || !cursor) return;
    await data.fetch({ request: { type: 'search', query: request.query, cursor } }, { force: true });
  },

  refresh: async host => {
    const { appActive, hosts, window } = get();
    const { request, visible } = hosts[host];
    if (!appActive || !visible || request.query === '') return;
    await useSportsStore.getState().fetch({ request: getQueryRequest(request), window }, { force: true });
  },

  retry: async host => {
    const state = get();
    const data = useSportsStore.getState();
    const request = state.hosts[host].request;
    const error = data.queryCache[getSportsRequestKey(request, state.window)]?.errorInfo?.error;
    const code = error instanceof RainbowFetchError ? error.responseBody?.code : undefined;
    if (code === 5 && request.query === null && request.destination.type === 'scope') {
      state.selectDestination(host, { type: 'live' });
      return;
    }
    const cursor = getSportsResult(data, request)?.nextCursor;
    if (cursor && code !== 9) await state.loadMore(host);
    else await state.refresh(host);
  },

  updateWindow: now => {
    const window = getSportsWindow(now);
    if (window.from === get().window.from) return;
    useSportsStore.getState().clear();
    set({ window });
  },

  setQuoteConsumer: (owner, update) =>
    set(state => {
      const previous = state.quoteConsumers.get(owner);
      const consumer = { ...update, visibleGameIds: previous?.visibleGameIds ?? [] };
      if (previous && consumer.active === previous.active && shallowEqual(consumer.renderedGameIds, previous.renderedGameIds)) return state;
      return { quoteConsumers: new Map(state.quoteConsumers).set(owner, consumer) };
    }),

  setVisibleQuoteGames: (owner, visibleGameIds) =>
    set(state => {
      const previous = state.quoteConsumers.get(owner);
      if (!previous || shallowEqual(previous.visibleGameIds, visibleGameIds)) return state;
      return { quoteConsumers: new Map(state.quoteConsumers).set(owner, { ...previous, visibleGameIds }) };
    }),

  removeQuoteConsumer: owner =>
    set(state => {
      if (!state.quoteConsumers.has(owner)) return state;
      const quoteConsumers = new Map(state.quoteConsumers);
      quoteConsumers.delete(owner);
      return { quoteConsumers };
    }),

  setLookupConsumer: (owner, update) => {
    const previous = get().lookupConsumers.get(owner);
    const consumer = { ...update, visibleIds: update.visibleIds ?? previous?.visibleIds ?? [] };
    if (
      previous &&
      previous.route === consumer.route &&
      previous.active === consumer.active &&
      shallowEqual(previous.eventIds, consumer.eventIds) &&
      shallowEqual(previous.visibleIds, consumer.visibleIds)
    )
      return;
    set(state => ({ lookupConsumers: new Map(state.lookupConsumers).set(owner, consumer) }));
    releaseLookupData(!previous || !shallowEqual(previous.eventIds, consumer.eventIds));
  },

  setVisibleLookupEvents: (owner, visibleIds) => {
    const previous = get().lookupConsumers.get(owner);
    if (!previous || shallowEqual(previous.visibleIds, visibleIds)) return;
    set(state => ({ lookupConsumers: new Map(state.lookupConsumers).set(owner, { ...previous, visibleIds }) }));
    releaseLookupData(false);
  },

  removeLookupConsumer: owner => {
    if (!get().lookupConsumers.has(owner)) return;
    set(state => {
      const lookupConsumers = new Map(state.lookupConsumers);
      lookupConsumers.delete(owner);
      return { lookupConsumers };
    });
    releaseLookupData(true);
  },
}));

export const sportsActions = createStoreActions(useSportsViewStore);

function setBrowseRequest(host: SportsHost, request: BrowseRequest, category?: SportsDestination): void {
  const { hosts, window } = useSportsViewStore.getState();
  const previousQuery = hosts[host].request.query;
  useSportsViewStore.setState({
    hosts: { ...hosts, [host]: { ...hosts[host], request, category: category ?? hosts[host].category } },
  });
  if (!previousQuery || Object.values(useSportsViewStore.getState().hosts).some(host => host.request.query === previousQuery)) return;
  useSportsStore.setState(state => {
    if (state.search?.query === previousQuery) return state;
    const key = getSportsRequestKey(hosts[host].request, window);
    if (!state.queryCache[key]) return state;
    const queryCache = { ...state.queryCache };
    delete queryCache[key];
    return { queryCache };
  });
}

// ============ Data ========================================================== //

export type SportsResult = { gameIds: string[]; sections: SportsSection[]; nextCursor?: string };
type SportsSearchResult = SportsResult & { query: string; queryKey: string };
type SportsState = {
  catalog: SportsCatalog | undefined;
  games: Partial<Record<string, Game>>;
  results: Partial<Record<string, SportsResult & { destination: SportsDestination }>>;
  search: SportsSearchResult | undefined;
  eventGames: Partial<Record<string, string | null>>;
  counts: Record<string, number>;
  clear: () => void;
};

type SportsRequest =
  | { type: 'browse'; destination: SportsDestination }
  | { type: 'search'; query: string; cursor?: string }
  | { type: 'lookup'; eventIds: string[] };
type SportsParams = { request: SportsRequest | null; window: SportsWindow };
type SportsResponse = GetGamesResponse | SearchGamesResponse | LookupGamesResponse | null;

const sportsRequestStore = createDerivedStore(getSportsRequest, deepEqual);

export const useSportsStore = createQueryStore<SportsResponse, SportsParams, SportsState, SportsResponse>(
  {
    fetcher: fetchSports,
    setData: setSportsData,
    cacheTime: ({ request }) => (request?.type === 'lookup' ? 0 : Infinity),
    staleTime: $ => ($(sportsRequestStore)?.type === 'search' ? Infinity : time.seconds(60)),
    enabled: $ => $(sportsRequestStore) !== null,
    params: {
      request: queryParam($ => $(sportsRequestStore), {
        key: (request: SportsRequest | null) => (request?.type === 'search' ? { ...request, cursor: undefined } : request),
      }),
      window: $ => $(useSportsViewStore, state => state.window),
    },
  },
  set => ({ ...emptyData(), clear: () => set({ ...emptyData(), queryCache: {} }) })
);

function emptyData(): Omit<SportsState, 'clear'> {
  return { catalog: undefined, games: {}, results: {}, search: undefined, eventGames: {}, counts: {} };
}

function getSportsRequest($: DeriveGetter): SportsRequest | null {
  if (!$(useSportsViewStore, state => state.appActive)) return null;
  const route = $(useNavigationStore, state => state.activeRoute);
  const hostName = route === Routes.SPORTS_SCREEN ? 'main' : route === Routes.POLYMARKET_BROWSE_EVENTS_SCREEN ? 'predictions' : undefined;
  const host = hostName ? $(useSportsViewStore, state => state.hosts[hostName]) : undefined;
  if (host?.visible) {
    return host.request.query === '' ? null : getQueryRequest(host.request);
  }
  const lookupConsumers = $(useSportsViewStore, state => state.lookupConsumers);
  const eventIds = [
    ...new Set(
      [...lookupConsumers.values()]
        .filter(consumer => consumer.active && consumer.route === route)
        .flatMap(consumer => consumer.visibleIds.filter(id => consumer.eventIds.includes(id)))
    ),
  ];
  eventIds.sort();
  return eventIds.length ? { type: 'lookup', eventIds } : null;
}

async function fetchSports({ request, window }: SportsParams, controller: AbortController | null): Promise<SportsResponse> {
  if (!request) return null;
  if (request.type === 'lookup') return sportsClient.lookupGames({ eventIds: request.eventIds }, controller);
  if (request.type === 'search') {
    return sportsClient.searchGames({ query: request.query, cursor: request.cursor, ...window }, controller);
  }
  const { destination } = request;
  if (destination.type === 'all') return { catalog: await sportsClient.getCatalog(controller), games: [] };
  if (destination.type === 'live') return sportsClient.getLiveGames({}, controller);
  const catalog = useSportsStore.getState().catalog ?? buildSportsCatalog(await sportsClient.getCatalog(controller));
  return hasCompetitionDirectory(catalog, destination.scopeId)
    ? sportsClient.getLiveGames({ scopeId: destination.scopeId }, controller)
    : sportsClient.getGames({ scopeId: destination.scopeId, ...window }, controller);
}

// ============ Admission ===================================================== //

function setSportsData({ data, params: { request, window }, queryKey, set }: SetDataParams<SportsResponse, SportsParams, SportsState>) {
  if (!data || !request) return;
  set(state => {
    if (data.catalog && state.catalog && data.catalog.revision < state.catalog.revision) {
      throw new Error('Sports response uses an older catalog.');
    }
    const catalog = data.catalog && data.catalog.revision !== state.catalog?.revision ? buildSportsCatalog(data.catalog) : state.catalog;
    const changedCatalog = catalog !== state.catalog;

    let results: SportsState['results'] = changedCatalog ? {} : state.results;
    let search = changedCatalog ? undefined : state.search;
    let queryCache = changedCatalog ? { [queryKey]: state.queryCache[queryKey] } : state.queryCache;
    let eventGames = state.eventGames;
    let mayReleaseGames = changedCatalog && (state.search !== undefined || Object.keys(state.results).length > 0);
    let countsChanged = changedCatalog;
    let admitted = new Set<string>();
    let currentKey: string | undefined;

    if (request.type === 'browse') {
      currentKey = getSportsDestinationKey(request.destination);
      const previous = results[currentKey];
      const responseIds = new Set(data.games.map(game => game.id));
      const unchanged =
        previous &&
        previous.gameIds.length === responseIds.size &&
        previous.gameIds.every(id => responseIds.has(id)) &&
        data.games.every(game => sameGrouping(state.games[game.id], game));
      const sections = unchanged
        ? previous.sections
        : replaceEqualDeep(
            previous?.sections,
            getSportsSections({
              catalog,
              games: Object.fromEntries(data.games.map(game => [game.id, game])),
              gameIds: [...responseIds],
              destination: request.destination,
              now: new Date(window.from),
            })
          );
      const gameIds = unchanged
        ? previous.gameIds
        : replaceEqualDeep(
            previous?.gameIds,
            sections.flatMap(section => section.gameIds)
          );
      admitted = new Set(gameIds);
      mayReleaseGames ||= previous?.gameIds.some(id => !admitted.has(id)) ?? false;
      countsChanged ||= !sameDisplayedGames(previous?.sections, sections);
      if (sections !== previous?.sections || gameIds !== previous?.gameIds) {
        results = { ...results, [currentKey]: { destination: request.destination, gameIds, sections } };
      }
    } else if (request.type === 'search') {
      const previous = request.cursor && search?.query === request.query && search.nextCursor === request.cursor ? search.gameIds : [];
      const gameIds = [...new Set([...previous, ...data.games.map(game => game.id)])].slice(0, MAX_SPORTS_SECTION_GAMES);
      admitted = new Set(gameIds);
      if (search && search.queryKey !== queryKey) {
        queryCache = { ...queryCache };
        delete queryCache[search.queryKey];
      }
      const nextSearch = replaceEqualDeep(search, {
        query: request.query,
        queryKey,
        gameIds,
        sections: gameIds.length ? [{ type: 'search' as const, gameIds }] : [],
        nextCursor: gameIds.length < MAX_SPORTS_SECTION_GAMES && 'nextCursor' in data ? data.nextCursor : undefined,
      });
      mayReleaseGames ||= search?.gameIds.some(id => !admitted.has(id)) ?? false;
      countsChanged ||= !sameDisplayedGames(search?.sections, nextSearch.sections);
      search = nextSearch;
    } else if ('resolved' in data) {
      let retainedEvents: Set<string> | undefined;
      for (const { eventId, gameId } of data.resolved) {
        if (eventGames[eventId] === gameId) continue;
        if (!(retainedEvents ??= retainedLookupEvents()).has(eventId)) continue;
        admitted.add(gameId);
        mayReleaseGames ||= typeof eventGames[eventId] === 'string';
        if (eventGames === state.eventGames) eventGames = { ...eventGames };
        eventGames[eventId] = gameId;
      }
      for (const eventId of data.unavailableEventIds) {
        if (eventGames[eventId] === null || !(retainedEvents ??= retainedLookupEvents()).has(eventId)) continue;
        mayReleaseGames ||= typeof eventGames[eventId] === 'string';
        if (eventGames === state.eventGames) eventGames = { ...eventGames };
        eventGames[eventId] = null;
      }
    }

    let games = state.games;
    const changedGrouping = new Set<string>();
    const changedScopes = new Set<string>();

    for (const incomingGame of data.games) {
      const previous = games[incomingGame.id];
      if (!previous && !admitted.has(incomingGame.id)) continue;
      const game = replaceEqualDeep(previous, incomingGame);
      if (game === previous) continue;

      if (games === state.games) games = { ...games };
      games[game.id] = game;
      if (previous && !sameGrouping(previous, game)) changedGrouping.add(game.id);
      if (previous && !sameIds(previous.competitionIds, game.competitionIds)) changedScopes.add(game.id);
    }

    if (changedGrouping.size) {
      for (const [key, result] of Object.entries(results)) {
        if (!result || key === currentKey || !result.gameIds.some(id => changedGrouping.has(id))) continue;
        const sections = replaceEqualDeep(
          result.sections,
          getSportsSections({
            catalog,
            games,
            gameIds: result.gameIds,
            destination: result.destination,
            now: new Date(window.from),
          })
        );
        if (sections === result.sections) continue;
        countsChanged ||= !sameDisplayedGames(result.sections, sections);
        if (results === state.results) results = { ...results };
        results[key] = { ...result, sections };
      }
    }

    const displayedIds =
      countsChanged || changedScopes.size
        ? [
            ...Object.values(results).flatMap(result => result?.sections.flatMap(section => section.gameIds) ?? []),
            ...(search?.gameIds ?? []),
          ]
        : [];
    countsChanged ||= displayedIds.some(id => changedScopes.has(id));

    const next = { catalog, games, results, search, eventGames };
    const retained = mayReleaseGames ? pruneGames(next) : {};
    const counts = countsChanged ? getSportsDirectoryCounts({ catalog, games, gameIds: displayedIds }) : state.counts;
    return { ...next, ...retained, counts, queryCache };
  });
}

function sameDisplayedGames(previous: SportsSection[] | undefined, next: SportsSection[]): boolean {
  if (previous === next) return true;
  return sameIds(
    previous?.flatMap(section => section.gameIds) ?? [],
    next.flatMap(section => section.gameIds)
  );
}

function sameIds(first: readonly string[], second: readonly string[]): boolean {
  if (first === second) return true;
  const before = new Set(first);
  const after = new Set(second);
  return before.size === after.size && [...before].every(id => after.has(id));
}

function sameGrouping(previous: Game | undefined, next: Game): boolean {
  return (
    previous !== undefined &&
    previous.status === next.status &&
    previous.startsAt === next.startsAt &&
    shallowEqual(previous.competitionIds, next.competitionIds)
  );
}

// ============ Retention ===================================================== //

function retainedLookupEvents(): Set<string> {
  return new Set([...useSportsViewStore.getState().lookupConsumers.values()].flatMap(consumer => consumer.eventIds));
}

function pruneGames(state: Pick<SportsState, 'games' | 'results' | 'search' | 'eventGames'>) {
  const retained = new Set([
    ...Object.values(state.results).flatMap(result => result?.gameIds ?? []),
    ...(state.search?.gameIds ?? []),
    ...Object.values(state.eventGames),
  ]);
  let games = state.games;
  for (const id of Object.keys(games)) {
    if (retained.has(id)) continue;
    if (games === state.games) games = { ...games };
    delete games[id];
  }
  return { games };
}

function releaseLookupData(releaseEvents: boolean) {
  const retained = releaseEvents ? retainedLookupEvents() : undefined;
  useSportsStore.setState(state => {
    let eventGames = state.eventGames;
    if (retained) {
      for (const id of Object.keys(eventGames)) {
        if (retained.has(id)) continue;
        if (eventGames === state.eventGames) eventGames = { ...eventGames };
        delete eventGames[id];
      }
    }
    let queryCache = state.queryCache;
    for (const [key, entry] of Object.entries(queryCache)) {
      if (entry?.cacheTime !== 0 || key === state.queryKey) continue;
      if (queryCache === state.queryCache) queryCache = { ...queryCache };
      delete queryCache[key];
    }
    if (eventGames === state.eventGames && queryCache === state.queryCache) return state;
    return { eventGames, queryCache, ...(eventGames !== state.eventGames && pruneGames({ ...state, eventGames })) };
  });
}

// ============ Query Selection ============================================== //

export function getSportsResult(state: SportsState, request: BrowseRequest): SportsResult | undefined {
  if (request.query === null) return state.results[getSportsDestinationKey(request.destination)];
  return state.search?.query === request.query ? state.search : undefined;
}

export function getSportsRequestKey(request: BrowseRequest, window: SportsWindow): string {
  return getQueryKey({ request: getQueryRequest(request), window });
}

function getQueryRequest({ destination, query }: BrowseRequest): SportsRequest {
  return query === null ? { type: 'browse', destination } : { type: 'search', query };
}
