import { createQueryStore, createStoreActions, deepEqual, getQueryKey, parseQueryKey, type QueryStoreState } from '@storesjs/stores';

import {
  getSportsParentDestination,
  getSportsWindow,
  hasCompetitionDirectory,
  type SportsDestination,
  type SportsHost,
  type SportsWindow,
} from '@/features/sports/core/browse';
import {
  type Game,
  type GetGamesResponse,
  type LookupGamesResponse,
  type SearchGamesResponse,
  type SportsCatalog,
} from '@/features/sports/core/generated/sports';
import { sportsClient } from '@/features/sports/data/api/client';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

// ============ State ========================================================= //

type BrowseRequest = {
  destination: SportsDestination;
  query: string | null;
  cursor?: string;
};

export type SportsResult = {
  gameIds: string[];
  nextCursor?: string;
};

type HostState = {
  request: BrowseRequest;
  navigationRoot: SportsDestination;
  mounted: boolean;
  visible: boolean;
};

type ExactConsumer = { eventIds: string[]; visibleEventIds: string[] };

export type SportsState = {
  catalog: SportsCatalog | undefined;
  games: Partial<Record<string, Game>>;
  hosts: Record<SportsHost, HostState>;
  window: SportsWindow;
  exactConsumers: Map<symbol, ExactConsumer>;
  eventGames: Partial<Record<string, string | null>>;
  setHostVisibility: (host: SportsHost, visible: boolean) => void;
  releaseHost: (host: SportsHost) => void;
  selectDestination: (host: SportsHost, destination: SportsDestination) => void;
  openScope: (host: SportsHost, scopeId: string) => void;
  goBack: (host: SportsHost) => void;
  setSearch: (host: SportsHost, query: string | null) => void;
  loadMore: (host: SportsHost) => void;
  refresh: (host: SportsHost) => Promise<void>;
  updateWindow: (now?: Date) => void;
  setExactConsumer: (owner: symbol, eventIds: string[], visibleEventIds: string[]) => void;
  removeExactConsumer: (owner: symbol) => void;
};

type BrowseView = { host: SportsHost; request: BrowseRequest; window: SportsWindow };
type BrowseParams = { view: BrowseView | null; revision: number };
type BrowseResponse = GetGamesResponse | SearchGamesResponse;
type StoreState = QueryStoreState<SportsResult | null, BrowseParams, SportsState>;

function initialHost(): HostState {
  return { request: { destination: { type: 'live' }, query: null }, navigationRoot: { type: 'live' }, mounted: false, visible: false };
}

function activeHost(state: SportsState): SportsHost | null {
  if (state.hosts.predictions.visible) return 'predictions';
  return state.hosts.main.visible ? 'main' : null;
}

// ============ Browse ======================================================== //

export const useSportsStore = createQueryStore<BrowseResponse | null, BrowseParams, SportsState, SportsResult | null>(
  {
    fetcher: fetchBrowse,
    cacheTime: Infinity,
    staleTime: ($, store) =>
      $(store, state => {
        const host = activeHost(state);
        const current = host ? state.hosts[host] : undefined;
        const result = host ? getSportsResult(state, host) : null;
        if (!current || !result || (current.request.cursor && current.request.cursor === result.nextCursor)) return 0;
        return current.request.query !== null ? Infinity : time.seconds(60);
      }),
    suppressStaleTimeWarning: true,
    enabled: ($, store) =>
      $(store, state => {
        const host = activeHost(state);
        return host !== null && state.hosts[host].request.query !== '';
      }),
    params: {
      revision: ($, store) => $(store, state => state.catalog?.revision ?? 0),
      view: ($, store) =>
        $(
          store,
          state => {
            const host = activeHost(state);
            return host ? { host, request: state.hosts[host].request, window: state.window } : null;
          },
          deepEqual
        ),
    },
    transform: admitBrowse,
    onFetched: ({ data, params, set }) => {
      set(state => {
        const queryKey = getQueryKey(params);
        const effectiveKey = getQueryKey({ ...params, revision: state.catalog?.revision ?? 0 });
        const entry = state.queryCache[queryKey];
        const queryCache = data && entry ? { ...state.queryCache, [effectiveKey]: entry } : state.queryCache;
        return pruneGames({ ...state, queryCache }, effectiveKey);
      });
    },
  },
  (set, get) => ({
    catalog: undefined,
    games: {},
    hosts: { main: initialHost(), predictions: initialHost() },
    window: getSportsWindow(),
    exactConsumers: new Map(),
    eventGames: {},

    setHostVisibility: (host, visible) =>
      set(state => {
        const current = state.hosts[host];
        if (current.mounted && current.visible === visible) return state;
        return { hosts: { ...state.hosts, [host]: { ...current, mounted: true, visible } } };
      }),

    releaseHost: host =>
      set(state =>
        pruneGames({
          ...state,
          hosts: { ...state.hosts, [host]: { ...restartSearch(state.hosts[host]), mounted: false, visible: false } },
        })
      ),

    selectDestination: (host, destination) =>
      set(state => {
        const current = state.hosts[host];
        if (
          current.request.query === null &&
          deepEqual(current.request.destination, destination) &&
          deepEqual(current.navigationRoot, destination)
        )
          return state;
        return pruneGames({
          ...state,
          hosts: {
            ...state.hosts,
            [host]: { ...current, navigationRoot: destination, request: { destination, query: null } },
          },
        });
      }),

    openScope: (host, scopeId) =>
      set(state => {
        const current = state.hosts[host];
        const destination: SportsDestination = { type: 'scope', scopeId };
        if (current.request.query === null && deepEqual(current.request.destination, destination)) return state;
        return pruneGames({
          ...state,
          hosts: { ...state.hosts, [host]: { ...current, request: { destination, query: null } } },
        });
      }),

    goBack: host =>
      set(state => {
        const current = state.hosts[host];
        const destination = getSportsParentDestination(state.catalog, current.request.destination, current.navigationRoot);
        if (!destination) return state;
        return pruneGames({
          ...state,
          hosts: { ...state.hosts, [host]: { ...current, request: { destination, query: null } } },
        });
      }),

    setSearch: (host, query) =>
      set(state => {
        const current = state.hosts[host];
        const text = query === null ? null : query.trim();
        if (current.request.query === text) return state;
        return pruneGames({
          ...state,
          hosts: {
            ...state.hosts,
            [host]: { ...current, request: { destination: current.request.destination, query: text } },
          },
        });
      }),

    loadMore: host => {
      const state = get();
      const current = state.hosts[host];
      const cursor = getSportsResult(state, host)?.nextCursor;
      if (activeHost(state) !== host || !current.request.query || !cursor || state.getStatus('isLoading')) return;
      set({ hosts: { ...state.hosts, [host]: { ...current, request: { ...current.request, cursor } } } });
    },

    refresh: async host => {
      const state = get();
      if (activeHost(state) !== host) return;
      const current = state.hosts[host];
      if (current.request.cursor) {
        set({ hosts: { ...state.hosts, [host]: { ...current, request: { ...current.request, cursor: undefined } } } });
      }
      await get().fetch(undefined, { force: true });
    },

    updateWindow: now =>
      set(state => {
        const window = getSportsWindow(now);
        if (deepEqual(window, state.window)) return state;
        return pruneGames({
          ...state,
          window,
          hosts: { main: restartSearch(state.hosts.main), predictions: restartSearch(state.hosts.predictions) },
        });
      }),

    setExactConsumer: (owner, eventIds, visibleEventIds) =>
      set(state => {
        const retained = new Set(eventIds);
        const consumer = {
          eventIds: [...retained].sort(),
          visibleEventIds: [...new Set(visibleEventIds.filter(id => retained.has(id)))].sort(),
        };
        if (deepEqual(state.exactConsumers.get(owner), consumer)) return state;
        const exactConsumers = new Map(state.exactConsumers);
        if (consumer.eventIds.length) exactConsumers.set(owner, consumer);
        else exactConsumers.delete(owner);
        return pruneGames({ ...state, exactConsumers });
      }),

    removeExactConsumer: owner =>
      set(state => {
        if (!state.exactConsumers.has(owner)) return state;
        const exactConsumers = new Map(state.exactConsumers);
        exactConsumers.delete(owner);
        return pruneGames({ ...state, exactConsumers });
      }),
  })
);

export const sportsActions = createStoreActions(useSportsStore);

async function fetchBrowse({ view }: BrowseParams, controller: AbortController | null): Promise<BrowseResponse | null> {
  if (!view) return null;
  try {
    return await fetchView(view, controller);
  } catch (error) {
    const state = useSportsStore.getState();
    const isCurrent =
      !controller?.signal.aborted && activeHost(state) === view.host && deepEqual(state.hosts[view.host].request, view.request);
    const code = error instanceof RainbowFetchError ? error.responseBody?.code : undefined;
    if (isCurrent && code === 5 && view.request.destination.type === 'scope') {
      sportsActions.selectDestination(view.host, { type: 'live' });
      return null;
    }
    if (isCurrent && code === 9 && view.request.cursor) {
      sportsActions.refresh(view.host);
      return null;
    }
    throw error;
  }
}

async function fetchView(view: BrowseView, controller: AbortController | null): Promise<BrowseResponse | null> {
  const { request, window } = view;
  const { destination, query, cursor } = request;
  const scopeId = destination.type === 'scope' ? destination.scopeId : undefined;
  if (query !== null) {
    return query ? sportsClient.searchGames({ query, scopeId, cursor, ...window }, controller) : null;
  }
  if (destination.type === 'all') return { catalog: await sportsClient.getCatalog(controller), games: [] };
  if (destination.type === 'live') return sportsClient.getLiveGames({}, controller);
  const catalog = useSportsStore.getState().catalog ?? (await sportsClient.getCatalog(controller));
  return hasCompetitionDirectory(catalog, destination.scopeId)
    ? sportsClient.getLiveGames({ scopeId: destination.scopeId }, controller)
    : sportsClient.getGames({ scopeId: destination.scopeId, ...window }, controller);
}

// ============ Exact Event Lookup ============================================ //

export const useSportsLookupStore = createQueryStore<LookupGamesResponse | null, { eventIds: string[] }>({
  cacheTime: time.seconds(60),
  staleTime: $ =>
    $(useSportsStore, state => {
      for (const consumer of state.exactConsumers.values()) {
        if (consumer.visibleEventIds.some(id => state.eventGames[id] === undefined)) return 0;
      }
      return time.seconds(60);
    }),
  suppressStaleTimeWarning: true,
  enabled: $ => $(useSportsStore, state => [...state.exactConsumers.values()].some(consumer => consumer.visibleEventIds.length > 0)),
  params: {
    eventIds: $ =>
      $(useSportsStore, state => [...new Set([...state.exactConsumers.values()].flatMap(consumer => consumer.visibleEventIds))].sort()),
  },
  fetcher: ({ eventIds }, controller) => (eventIds.length ? sportsClient.lookupGames({ eventIds }, controller) : null),
  setData: ({ data }) => {
    if (!data) return;
    useSportsStore.setState(state => {
      const graph = withCatalog(state, data.catalog);
      const eventGames = { ...state.eventGames };
      for (const resolution of data.resolved) eventGames[resolution.eventId] = resolution.gameId;
      for (const eventId of data.unavailableEventIds) eventGames[eventId] = null;
      return pruneGames({ ...graph, games: mergeGames(state.games, data.games), eventGames });
    });
  },
});

// ============ Graph Updates ================================================= //

function withCatalog(state: StoreState, catalog: SportsCatalog | undefined): StoreState {
  if (!catalog || catalog.revision === state.catalog?.revision) return state;
  if (state.catalog && catalog.revision < state.catalog.revision) throw new Error('Sports response uses an older catalog.');
  return {
    ...state,
    catalog,
    queryCache: {},
    hosts: {
      main: restartSearch(state.hosts.main),
      predictions: restartSearch(state.hosts.predictions),
    },
  };
}

function restartSearch(host: HostState): HostState {
  return host.request.cursor ? { ...host, request: { ...host.request, cursor: undefined } } : host;
}

function mergeGames(previous: SportsState['games'], incoming: Game[]): SportsState['games'] {
  const games = { ...previous };
  for (const game of incoming) {
    if (!deepEqual(previous[game.id], game)) games[game.id] = game;
  }
  return games;
}

function pruneGames(state: StoreState, completedKey?: string): StoreState {
  const queryCache: StoreState['queryCache'] = {};
  const completedView = completedKey ? parseQueryKey<BrowseParams>(completedKey).view : null;
  const gameIds = new Set<string>();
  for (const [key, entry] of Object.entries(state.queryCache)) {
    if (!entry) continue;
    const { view, revision } = parseQueryKey<BrowseParams>(key);
    if (!view || revision !== (state.catalog?.revision ?? 0) || !deepEqual(view.window, state.window)) continue;
    const host = state.hosts[view.host];
    if (!host.mounted) continue;
    if (view.request.query !== null) {
      if (view.request.query !== host.request.query || !deepEqual(view.request.destination, host.request.destination)) continue;
      if (completedView && key !== completedKey && sameResult(view, completedView)) continue;
    }
    queryCache[key] = entry;
    for (const id of entry.data?.gameIds ?? []) gameIds.add(id);
  }
  const eventGames: SportsState['eventGames'] = {};
  for (const consumer of state.exactConsumers.values()) {
    for (const eventId of consumer.eventIds) {
      const gameId = state.eventGames[eventId];
      if (gameId === undefined) continue;
      eventGames[eventId] = gameId;
      if (gameId) gameIds.add(gameId);
    }
  }
  const games: SportsState['games'] = {};
  for (const id of gameIds) if (state.games[id]) games[id] = state.games[id];
  return { ...state, games, queryCache, eventGames };
}

function sameResult(a: BrowseView, b: BrowseView): boolean {
  return (
    a.host === b.host &&
    a.request.query === b.request.query &&
    deepEqual(a.request.destination, b.request.destination) &&
    deepEqual(a.window, b.window)
  );
}

/** Read this host's exact destination, retaining its accumulated Search while a page loads. */
export function getSportsResult(state: StoreState, host: SportsHost): SportsResult | null {
  const view = { host, request: state.hosts[host].request, window: state.window };
  const revision = state.catalog?.revision ?? 0;
  const exact = state.queryCache[getQueryKey({ view, revision })]?.data;
  if (exact) return exact;
  if (view.request.query === null) return null;
  for (const [key, entry] of Object.entries(state.queryCache)) {
    if (!entry?.data) continue;
    const previous = parseQueryKey<BrowseParams>(key);
    if (previous.view && previous.revision === revision && sameResult(view, previous.view)) return entry.data;
  }
  return null;
}

/** Game IDs available through retained browse/Search results, excluding exact-only lookups. */
export function getSportsAvailableGameIds(state: StoreState): string[] {
  return [...new Set(Object.values(state.queryCache).flatMap(entry => entry?.data?.gameIds ?? []))];
}

function admitBrowse(data: BrowseResponse | null, { view }: BrowseParams): SportsResult | null {
  if (!data || !view) return null;
  const { host, request, window } = view;
  let result: SportsResult | null = null;
  useSportsStore.setState(state => {
    const current = state.hosts[host];
    if (!current.mounted || !deepEqual(current.request, request) || !deepEqual(state.window, window)) return state;
    const graph = withCatalog(state, data.catalog);
    const previous = getSportsResult(graph, host);
    if (request.cursor && previous?.nextCursor !== request.cursor) {
      result = previous;
      return graph;
    }
    const gameIds =
      request.cursor && previous
        ? [...new Set([...previous.gameIds, ...data.games.map(game => game.id)])]
        : data.games.map(game => game.id);
    const next = { gameIds, nextCursor: 'nextCursor' in data ? data.nextCursor : undefined };
    result = deepEqual(previous, next) ? previous : next;
    // Stores publishes these IDs after transform returns. Their Games must already exist.
    return { ...graph, games: mergeGames(graph.games, data.games) };
  });
  return result;
}
