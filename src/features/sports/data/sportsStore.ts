import { createQueryStore, createStoreActions, deepEqual } from '@storesjs/stores';

import {
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
  mounted: boolean;
  visible: boolean;
  result: SportsResult | null;
};

type ExactConsumer = { eventIds: string[]; visible: boolean };

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
  setSearch: (host: SportsHost, query: string | null) => void;
  loadMore: (host: SportsHost) => void;
  refresh: (host: SportsHost) => Promise<void>;
  updateWindow: (now?: Date) => void;
  setExactConsumer: (owner: symbol, eventIds: string[], visible: boolean) => void;
  removeExactConsumer: (owner: symbol) => void;
};

type BrowseView = { host: SportsHost; request: BrowseRequest; window: SportsWindow };
type BrowseParams = { view: BrowseView | null };
type BrowseResponse = GetGamesResponse | SearchGamesResponse;

function initialHost(): HostState {
  return { request: { destination: { type: 'live' }, query: null }, mounted: false, visible: false, result: null };
}

function activeHost(state: SportsState): SportsHost | null {
  if (state.hosts.predictions.visible) return 'predictions';
  return state.hosts.main.visible ? 'main' : null;
}

// ============ Browse ======================================================== //

export const useSportsStore = createQueryStore<BrowseResponse | null, BrowseParams, SportsState>(
  {
    fetcher: fetchBrowse,
    cacheTime: time.seconds(60),
    staleTime: ($, store) =>
      $(store, state => {
        const host = activeHost(state);
        const current = host ? state.hosts[host] : undefined;
        if (!current?.result || (current.request.cursor && current.request.cursor === current.result.nextCursor)) return 0;
        return current.request.query !== null ? Infinity : time.seconds(60);
      }),
    suppressStaleTimeWarning: true,
    enabled: ($, store) =>
      $(store, state => {
        const host = activeHost(state);
        return host !== null && state.hosts[host].request.query !== '';
      }),
    params: {
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
    setData: ({ data, params, set }) => {
      const view = params.view;
      if (!data || !view) return;
      const { host, request, window } = view;
      set(state => {
        const current = state.hosts[host];
        if (!current.mounted || !deepEqual(current.request, request) || !deepEqual(state.window, window)) return state;
        const graph = withCatalog(state, data.catalog);
        const previous = graph.hosts[host].result;
        const continuation = request.cursor;
        if (continuation && previous?.nextCursor !== continuation) return pruneGames(graph);
        const gameIds =
          continuation && previous
            ? [...new Set([...previous.gameIds, ...data.games.map(game => game.id)])]
            : data.games.map(game => game.id);
        const result = { gameIds, nextCursor: 'nextCursor' in data ? data.nextCursor : undefined };
        return pruneGames({
          ...graph,
          games: mergeGames(state.games, data.games),
          hosts: { ...graph.hosts, [host]: { ...current, result: deepEqual(previous, result) ? previous : result } },
        });
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
          hosts: { ...state.hosts, [host]: { ...restartSearch(state.hosts[host]), mounted: false, visible: false, result: null } },
        })
      ),

    selectDestination: (host, destination) =>
      set(state => {
        const current = state.hosts[host];
        if (current.request.query === null && deepEqual(current.request.destination, destination)) return state;
        return pruneGames({
          ...state,
          hosts: { ...state.hosts, [host]: { ...current, request: { destination, query: null }, result: null } },
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
            [host]: { ...current, request: { destination: current.request.destination, query: text }, result: null },
          },
        });
      }),

    loadMore: host => {
      const state = get();
      const current = state.hosts[host];
      const cursor = current.result?.nextCursor;
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
        return { window, hosts: { main: restartSearch(state.hosts.main), predictions: restartSearch(state.hosts.predictions) } };
      }),

    setExactConsumer: (owner, eventIds, visible) =>
      set(state => {
        const consumer = { eventIds: [...new Set(eventIds)].sort(), visible };
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
        if (consumer.visible && consumer.eventIds.some(id => state.eventGames[id] === undefined)) return 0;
      }
      return time.seconds(60);
    }),
  suppressStaleTimeWarning: true,
  enabled: $ => $(useSportsStore, state => [...state.exactConsumers.values()].some(consumer => consumer.visible)),
  params: {
    eventIds: $ =>
      $(useSportsStore, state =>
        [...new Set([...state.exactConsumers.values()].filter(consumer => consumer.visible).flatMap(consumer => consumer.eventIds))].sort()
      ),
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

function withCatalog(state: SportsState, catalog: SportsCatalog | undefined): SportsState {
  if (!catalog || catalog.revision === state.catalog?.revision) return state;
  if (state.catalog && catalog.revision < state.catalog.revision) throw new Error('Sports response uses an older catalog.');
  return {
    ...state,
    catalog,
    hosts: {
      main: { ...restartSearch(state.hosts.main), result: null },
      predictions: { ...restartSearch(state.hosts.predictions), result: null },
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

function pruneGames(state: SportsState): Pick<SportsState, 'catalog' | 'games' | 'hosts' | 'eventGames' | 'exactConsumers'> {
  const gameIds = new Set([...(state.hosts.main.result?.gameIds ?? []), ...(state.hosts.predictions.result?.gameIds ?? [])]);
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
  return { catalog: state.catalog, games, hosts: state.hosts, eventGames, exactConsumers: state.exactConsumers };
}
