import {
  createBaseStore,
  createQueryStore,
  createStoreActions,
  deepEqual,
  queryParam,
  type DeriveGetter,
  type SetDataParams,
} from '@storesjs/stores';
import { replaceEqualDeep } from '@tanstack/query-core';

import {
  getSportsDestinationKey,
  getSportsParentDestination,
  getSportsWindow,
  hasCompetitionDirectory,
  type SportsDestination,
  type SportsHost,
  type SportsWindow,
} from '@/features/sports/core/browse';
import {
  type Competition,
  type Game,
  type GetGamesResponse,
  type LookupGamesResponse,
  type SearchGamesResponse,
  type Sport,
  type SportsCatalog,
} from '@/features/sports/core/generated/sports';
import { getSportsDirectoryCounts, getSportsSections, MAX_SPORTS_SECTION_GAMES, type SportsSection } from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { time } from '@/framework/core/utils/time';
import Routes, { type Route } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Navigation ==================================================== //

type BrowseRequest = { destination: SportsDestination; query: string | null };
type HostState = { request: BrowseRequest; navigationRoot: SportsDestination; visible: boolean };
type LookupConsumer = { route: Route; eventIds: string[] };

type SportsViewState = {
  hosts: Record<SportsHost, HostState>;
  window: SportsWindow;
  lookupConsumers: Map<symbol, LookupConsumer>;
  setHostVisibility: (host: SportsHost, visible: boolean) => void;
  releaseHost: (host: SportsHost) => void;
  selectDestination: (host: SportsHost, destination: SportsDestination) => void;
  openScope: (host: SportsHost, scopeId: string) => void;
  goBack: (host: SportsHost) => void;
  setSearch: (host: SportsHost, query: string | null) => void;
  loadMore: (host: SportsHost) => Promise<void>;
  refresh: (host: SportsHost) => Promise<void>;
  updateWindow: (now?: Date) => void;
  setLookupConsumer: (owner: symbol, route: Route, eventIds: string[]) => void;
  removeLookupConsumer: (owner: symbol) => void;
};

function initialHost(): HostState {
  return { request: { destination: { type: 'live' }, query: null }, navigationRoot: { type: 'live' }, visible: false };
}

export const useSportsViewStore = createBaseStore<SportsViewState>((set, get) => ({
  hosts: { main: initialHost(), predictions: initialHost() },
  window: getSportsWindow(),
  lookupConsumers: new Map(),

  setHostVisibility: (host, visible) =>
    set(state => {
      const current = state.hosts[host];
      return current.visible === visible ? state : { hosts: { ...state.hosts, [host]: { ...current, visible } } };
    }),
  releaseHost: host => get().setHostVisibility(host, false),

  selectDestination: (host, destination) =>
    set(state => ({
      hosts: { ...state.hosts, [host]: { ...state.hosts[host], navigationRoot: destination, request: { destination, query: null } } },
    })),
  openScope: (host, scopeId) =>
    set(state => ({
      hosts: { ...state.hosts, [host]: { ...state.hosts[host], request: { destination: { type: 'scope', scopeId }, query: null } } },
    })),
  goBack: host => {
    const { request, navigationRoot } = get().hosts[host];
    const destination = getSportsParentDestination(useSportsStore.getState().catalog, request.destination, navigationRoot);
    if (destination) set(state => ({ hosts: { ...state.hosts, [host]: { ...state.hosts[host], request: { destination, query: null } } } }));
  },
  setSearch: (host, query) =>
    set(state => {
      const current = state.hosts[host];
      const text = query === null ? null : query.trim();
      return current.request.query === text
        ? state
        : {
            hosts: { ...state.hosts, [host]: { ...current, request: { destination: current.request.destination, query: text } } },
          };
    }),
  loadMore: async host => {
    const { request } = get().hosts[host];
    const data = useSportsStore.getState();
    const cursor = getSportsResult(data, request)?.nextCursor;
    if (!get().hosts[host].visible || !request.query || !cursor) return;
    await data.fetch({ request: { type: 'search', destination: request.destination, query: request.query, cursor } }, { force: true });
  },
  refresh: async host => {
    if (!get().hosts[host].visible) return;
    await useSportsStore.getState().fetch(undefined, { force: true });
  },
  updateWindow: now => {
    const window = getSportsWindow(now);
    if (window.from === get().window.from) return;
    useSportsStore.getState().clear();
    set({ window });
  },
  setLookupConsumer: (owner, route, eventIds) =>
    set(state => {
      const consumer = { route, eventIds: [...new Set(eventIds)].sort() };
      if (deepEqual(state.lookupConsumers.get(owner), consumer)) return state;
      const lookupConsumers = new Map(state.lookupConsumers);
      if (consumer.eventIds.length) lookupConsumers.set(owner, consumer);
      else lookupConsumers.delete(owner);
      return { lookupConsumers };
    }),
  removeLookupConsumer: owner =>
    set(state => {
      if (!state.lookupConsumers.has(owner)) return state;
      const lookupConsumers = new Map(state.lookupConsumers);
      lookupConsumers.delete(owner);
      return { lookupConsumers };
    }),
}));

export const sportsActions = createStoreActions(useSportsViewStore);

// ============ Data ========================================================== //

export type SportsResult = { sections: SportsSection[]; nextCursor?: string };
type SportsSearchResult = SportsResult & { query: string; destination: SportsDestination; queryKey: string };
export type SportsState = {
  catalog: SportsCatalog | undefined;
  scopes: Partial<Record<string, Sport | Competition>>;
  sportByCompetition: Partial<Record<string, string>>;
  games: Partial<Record<string, Game>>;
  results: Partial<Record<string, SportsResult & { destination: SportsDestination }>>;
  search: SportsSearchResult | undefined;
  eventGames: Partial<Record<string, string | null>>;
  counts: Record<string, number>;
  clear: () => void;
};

type SportsRequest =
  | { type: 'browse'; destination: SportsDestination }
  | { type: 'search'; destination: SportsDestination; query: string; cursor?: string }
  | { type: 'lookup'; eventIds: string[] };
type SportsParams = { request: SportsRequest | null; window: SportsWindow };
type SportsResponse = GetGamesResponse | SearchGamesResponse | LookupGamesResponse | null;

export const useSportsStore = createQueryStore<SportsResponse, SportsParams, SportsState, SportsResponse>(
  {
    fetcher: fetchSports,
    setData: setSportsData,
    cacheTime: Infinity,
    staleTime: $ => (getSportsRequest($)?.type === 'search' ? Infinity : time.seconds(60)),
    enabled: $ => getSportsRequest($) !== null,
    params: {
      request: queryParam(getSportsRequest, {
        key: (request: SportsRequest | null) => (request?.type === 'search' ? { ...request, cursor: undefined } : request),
      }),
      window: $ => $(useSportsViewStore, state => state.window),
    },
  },
  set => ({ ...emptyData(), clear: () => set({ ...emptyData(), queryCache: {} }) })
);

function emptyData(): Omit<SportsState, 'clear'> {
  return { catalog: undefined, scopes: {}, sportByCompetition: {}, games: {}, results: {}, search: undefined, eventGames: {}, counts: {} };
}

function getSportsRequest($: DeriveGetter): SportsRequest | null {
  const state = $(useSportsViewStore, state => state);
  const route = $(useNavigationStore, state => state.activeRoute);
  const host =
    route === Routes.SPORTS_SCREEN
      ? state.hosts.main
      : route === Routes.POLYMARKET_BROWSE_EVENTS_SCREEN
        ? state.hosts.predictions
        : undefined;
  if (host?.visible) {
    const { destination, query } = host.request;
    if (query === '') return null;
    return query === null ? { type: 'browse', destination } : { type: 'search', destination, query };
  }
  const eventIds = [
    ...new Set([...state.lookupConsumers.values()].filter(consumer => consumer.route === route).flatMap(consumer => consumer.eventIds)),
  ];
  eventIds.sort();
  return eventIds.length ? { type: 'lookup', eventIds } : null;
}

async function fetchSports({ request, window }: SportsParams, controller: AbortController | null): Promise<SportsResponse> {
  if (!request) return null;
  if (request.type === 'lookup') return sportsClient.lookupGames({ eventIds: request.eventIds }, controller);
  const { destination } = request;
  const scopeId = destination.type === 'scope' ? destination.scopeId : undefined;
  if (request.type === 'search')
    return sportsClient.searchGames({ query: request.query, scopeId, cursor: request.cursor, ...window }, controller);
  if (destination.type === 'all') return { catalog: await sportsClient.getCatalog(controller), games: [] };
  if (destination.type === 'live') return sportsClient.getLiveGames({}, controller);
  const catalog = useSportsStore.getState().catalog ?? (await sportsClient.getCatalog(controller));
  return hasCompetitionDirectory(catalog, destination.scopeId)
    ? sportsClient.getLiveGames({ scopeId: destination.scopeId }, controller)
    : sportsClient.getGames({ scopeId: destination.scopeId, ...window }, controller);
}

function setSportsData({ data, params: { request, window }, queryKey, set }: SetDataParams<SportsResponse, SportsParams, SportsState>) {
  if (!data || !request) return;
  set(state => {
    const catalog = data.catalog?.revision === state.catalog?.revision ? state.catalog : (data.catalog ?? state.catalog);
    const changedCatalog = catalog?.revision !== state.catalog?.revision;
    if (catalog && state.catalog && catalog.revision < state.catalog.revision) throw new Error('Sports response uses an older catalog.');
    let results: SportsState['results'] = {};
    const incoming = Object.fromEntries(data.games.map(game => [game.id, game]));
    const games = { ...state.games, ...incoming };
    if (!changedCatalog) {
      for (const [key, result] of Object.entries(state.results)) {
        if (!result) continue;
        results[key] = {
          destination: result.destination,
          sections: getSportsSections({
            catalog,
            games,
            gameIds: result.sections.flatMap(section => section.gameIds),
            destination: result.destination,
            now: new Date(window.from),
          }),
        };
      }
    }
    let search = changedCatalog ? undefined : state.search;
    const eventGames = { ...state.eventGames };
    let queryCache = changedCatalog ? { [queryKey]: state.queryCache[queryKey] } : state.queryCache;

    if ('resolved' in data) {
      for (const resolution of data.resolved) eventGames[resolution.eventId] = resolution.gameId;
      for (const eventId of data.unavailableEventIds) eventGames[eventId] = null;
    } else if (request.type === 'search') {
      const previous =
        request.cursor &&
        search?.query === request.query &&
        getSportsDestinationKey(search.destination) === getSportsDestinationKey(request.destination) &&
        search.nextCursor === request.cursor
          ? (search.sections[0]?.gameIds ?? [])
          : [];
      const ids = [...new Set([...previous, ...data.games.map(game => game.id)])].slice(0, MAX_SPORTS_SECTION_GAMES);
      if (search && search.queryKey !== queryKey) {
        queryCache = { ...queryCache };
        delete queryCache[search.queryKey];
      }
      search = {
        query: request.query,
        destination: request.destination,
        queryKey,
        sections: ids.length ? [{ type: 'search', gameIds: ids }] : [],
        nextCursor: ids.length < MAX_SPORTS_SECTION_GAMES && 'nextCursor' in data ? data.nextCursor : undefined,
      };
    } else if (request.type === 'browse') {
      const sections = getSportsSections({
        catalog,
        games: incoming,
        gameIds: data.games.map(game => game.id),
        destination: request.destination,
        now: new Date(window.from),
      });
      results = { ...results, [getSportsDestinationKey(request.destination)]: { destination: request.destination, sections } };
    }

    const browseIds = [
      ...new Set([
        ...Object.values(results).flatMap(result => result?.sections.flatMap(section => section.gameIds) ?? []),
        ...(search?.sections.flatMap(section => section.gameIds) ?? []),
      ]),
    ];
    const retained = new Set([...browseIds, ...Object.values(eventGames)]);
    const retainedGames: SportsState['games'] = {};
    for (const id of retained) if (id && games[id]) retainedGames[id] = games[id];
    const scopes = changedCatalog
      ? Object.fromEntries(
          catalog?.sports.flatMap(sport => [[sport.id, sport], ...sport.competitions.map(competition => [competition.id, competition])]) ??
            []
        )
      : state.scopes;
    const sportByCompetition = changedCatalog
      ? Object.fromEntries(catalog?.sports.flatMap(sport => sport.competitions.map(competition => [competition.id, sport.id])) ?? [])
      : state.sportByCompetition;
    return {
      catalog,
      scopes,
      sportByCompetition,
      games: replaceEqualDeep(state.games, retainedGames),
      results: replaceEqualDeep(state.results, results),
      search: replaceEqualDeep(state.search, search),
      eventGames: replaceEqualDeep(state.eventGames, eventGames),
      counts: replaceEqualDeep(state.counts, getSportsDirectoryCounts({ catalog, games: retainedGames, gameIds: browseIds })),
      queryCache,
    };
  });
}

export function getSportsResult(state: SportsState, request: BrowseRequest): SportsResult | undefined {
  if (request.query === null) return state.results[getSportsDestinationKey(request.destination)];
  const search = state.search;
  return search?.query === request.query && getSportsDestinationKey(search.destination) === getSportsDestinationKey(request.destination)
    ? search
    : undefined;
}
