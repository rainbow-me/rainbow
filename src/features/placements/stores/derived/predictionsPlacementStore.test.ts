import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { useDiscoverNavigationStore } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { rainbowFetch, type RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';

import { usePredictionEventsStore } from './predictionsPlacementStore';

jest.mock('@/features/config/stores/remoteConfig', () => ({
  useRemoteConfigStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({
    getRemoteConfigKey: () => true,
  })),
}));
jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  useExperimentalConfigStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({
    getFlag: () => false,
  })),
}));
jest.mock('@/features/placements/surfaces/stores/discoverSurfaceStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  const refs = createBaseStore<DiscoverSurfacePlacementRefs>(() => ({ hyperliquid: [], polymarket: [], rainbow: [] }));
  return { useDiscoverSurfacePlacementRefs: refs, setRefs: refs.setState };
});
jest.mock('@/features/placements/stores/placementsStore', () => ({}));
jest.mock('@/features/sports/data/sportsStore', () => ({
  useSportsStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({ eventGameIds: {} })),
}));
jest.mock('@/features/polymarket/constants', () => ({
  CATEGORIES: { sports: { tagId: 'sports' } },
  DEFAULT_CATEGORY_KEY: 'trending',
  POLYMARKET_GAMMA_API_URL: 'https://gamma.test',
}));
jest.mock('@/features/polymarket/stores/polymarketTeamMetadataStore', () => ({ fetchPolymarketTeamMetadataForGameEvents: jest.fn() }));
jest.mock('@/features/polymarket/utils/transforms', () => ({ processRawPolymarketEvent: jest.fn() }));
jest.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: jest.fn() }));

const { setRefs } = jest.requireMock<{ setRefs: (refs: Partial<DiscoverSurfacePlacementRefs>) => void }>(
  '@/features/placements/surfaces/stores/discoverSurfaceStore'
);
const color = { dark: '#000000', light: '#ffffff' };
let unsubscribe: (() => void) | undefined;

function response<T>(data: T): RainbowFetchResponse<T> {
  return { data, headers: new Headers(), status: 200 };
}

function event(id: string) {
  return { id, title: id, markets: [{ active: true, closed: false }] };
}

function requestedIds(): string[][] {
  return jest.mocked(rainbowFetch).mock.calls.map(([url]) => new URL(String(url)).searchParams.getAll('id'));
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

beforeEach(() => {
  discoverEventListsStore.setState({ sections: {}, mountedEventIds: new Set() });
  useDiscoverNavigationStore.getState().navigate('featured');
  useDiscoverSearchQueryStore.setState({ isSearching: false });
  useSportsStore.setState({ eventGameIds: {} });
  setRefs({ polymarket: [] });
  usePredictionEventsStore.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  jest.clearAllMocks();
  jest.mocked(rainbowFetch).mockResolvedValue(response([]));
  jest.mocked(fetchPolymarketTeamMetadataForGameEvents).mockResolvedValue(new Map());
  jest.mocked(processRawPolymarketEvent).mockImplementation(async event => ({
    ...event,
    color,
    markets: event.markets.map(market => ({
      ...market,
      clobTokenIds: [],
      outcomes: [],
      outcomePrices: [],
      events: [],
      color,
      secondaryColor: undefined,
    })),
  }));
});

afterEach(async () => {
  unsubscribe?.();
  unsubscribe = undefined;
  await settle();
});

afterAll(() => usePredictionEventsStore.getState().reset(true));

test('an empty request skips event fetching and team metadata', async () => {
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });

  expect(rainbowFetch).not.toHaveBeenCalled();
  expect(fetchPolymarketTeamMetadataForGameEvents).not.toHaveBeenCalled();
});

test('requests tiles and displayed non-sports cards directly from their stores', async () => {
  setRefs({ polymarket: ['shared', 'tile'] });
  discoverEventListsStore.getState().setList('featured', 'cards', ['sports', 'shared', 'other', 'unknown']);
  discoverEventListsStore.getState().setList('next', 'cards', ['hidden']);
  useSportsStore.setState({ eventGameIds: { sports: 'sports', shared: null, other: null, hidden: null } });
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();

  expect(requestedIds()).toEqual([['other', 'shared', 'tile']]);

  useSportsStore.setState({ eventGameIds: { sports: 'sports', shared: null, other: null, hidden: null, unrelated: null } });
  discoverEventListsStore.getState().setList('featured', 'cards', ['unknown', 'other', 'shared', 'sports']);
  await settle();
  expect(rainbowFetch).toHaveBeenCalledTimes(1);

  useDiscoverNavigationStore.getState().navigate('next');
  await settle();
  expect(requestedIds().at(-1)).toEqual(['hidden', 'shared', 'tile']);

  useDiscoverSearchQueryStore.setState({ isSearching: true });
  await settle();
  expect(requestedIds().at(-1)).toEqual(['shared', 'tile']);
});

test('overlapping lists share a request and removing the last list disables it', async () => {
  useSportsStore.setState({ eventGameIds: { shared: null } });
  discoverEventListsStore.getState().setList('featured', 'first', ['shared']);
  discoverEventListsStore.getState().setList('featured', 'second', ['shared']);
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();

  discoverEventListsStore.getState().removeList('featured', 'first');
  await settle();
  expect(requestedIds()).toEqual([['shared']]);

  discoverEventListsStore.getState().removeList('featured', 'second');
  await settle();
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  expect(rainbowFetch).toHaveBeenCalledTimes(1);
});

test('discards inactive events before team lookup and card processing', async () => {
  const active = event('active');
  setRefs({ polymarket: ['active', 'closed', 'ended', 'resolved', 'inactive'] });
  jest
    .mocked(rainbowFetch)
    .mockResolvedValue(
      response([
        active,
        { ...event('closed'), closed: true },
        { ...event('ended'), ended: true },
        { id: 'resolved', markets: [{ umaResolutionStatus: 'resolved' }] },
        { id: 'inactive', markets: [{ active: false }] },
      ])
    );
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();

  expect(fetchPolymarketTeamMetadataForGameEvents).toHaveBeenCalledWith([active], expect.anything());
  expect(processRawPolymarketEvent).toHaveBeenCalledTimes(1);
  expect(Object.keys(usePredictionEventsStore.getState().getData() ?? {})).toEqual(['active']);
});

test('keeps displayed data through request changes and failed refreshes', async () => {
  let finish: (response: RainbowFetchResponse<unknown>) => void = () => {
    throw new Error('Request did not start');
  };
  jest.mocked(rainbowFetch).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );

  setRefs({ polymarket: ['first'] });
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();
  expect(usePredictionEventsStore.getState().getStatus('isInitialLoad')).toBe(true);
  finish(response([event('first')]));
  await settle();
  const previous = usePredictionEventsStore.getState().getData();

  setRefs({ polymarket: ['first', 'missing'] });
  await settle();

  expect(usePredictionEventsStore.getState().getData()).toBe(previous);
  expect(usePredictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  finish(response([event('first')]));
  await settle();
  expect(usePredictionEventsStore.getState().getData()?.first?.id).toBe('first');
  expect(usePredictionEventsStore.getState().getData()?.missing).toBeUndefined();
  expect(usePredictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(usePredictionEventsStore.getState().error).toBeNull();

  const displayed = usePredictionEventsStore.getState().getData();
  const error = new Error('Gamma unavailable');
  jest.mocked(rainbowFetch).mockRejectedValueOnce(error);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });

  expect(usePredictionEventsStore.getState().getData()).toBe(displayed);
  expect(usePredictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(usePredictionEventsStore.getState().error).toBe(error);
});
