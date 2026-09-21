import { type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';

import { selectPredictionEvent, usePredictionEventsStore } from './predictionsPlacementStore';

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
  const refs = createBaseStore<DiscoverSurfacePlacementRefs>(() => ({
    hyperliquid: [],
    polymarket: [],
    rainbow: [],
  }));
  return { useDiscoverSurfacePlacementRefs: refs, setRefs: refs.setState };
});
jest.mock('@/features/placements/stores/placementsStore', () => ({}));
jest.mock('@/features/polymarket/stores/polymarketEventsStore', () => ({ fetchPolymarketEventsByIds: jest.fn() }));
jest.mock('@/features/polymarket/stores/polymarketTeamMetadataStore', () => ({ fetchPolymarketTeamMetadataForGameEvents: jest.fn() }));
jest.mock('@/features/polymarket/utils/transforms', () => ({ processRawPolymarketEvent: jest.fn() }));

const { setRefs } = jest.requireMock<{ setRefs: (refs: Partial<DiscoverSurfacePlacementRefs>) => void }>(
  '@/features/placements/surfaces/stores/discoverSurfaceStore'
);
const first = Symbol('first fallback');
const second = Symbol('second fallback');

beforeEach(() => {
  usePredictionEventsStore.setState({ fallbackConsumers: new Map() });
  setRefs({ polymarket: [] });
  jest.clearAllMocks();
  jest.mocked(fetchPolymarketEventsByIds).mockResolvedValue([]);
  jest.mocked(fetchPolymarketTeamMetadataForGameEvents).mockResolvedValue(new Map());
});

afterAll(() => usePredictionEventsStore.getState().reset(true));

test('no generic or visible fallback demand means no Gamma or team hydration', async () => {
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(fetchPolymarketEventsByIds).not.toHaveBeenCalled();
  expect(fetchPolymarketTeamMetadataForGameEvents).not.toHaveBeenCalled();
});

test('visible fallback registrations and generic tiles share one deduplicated event request', async () => {
  setRefs({ polymarket: ['tile-only', 'shared'] });
  const { setFallbackConsumer } = usePredictionEventsStore.getState();
  setFallbackConsumer(first, 'shared');
  setFallbackConsumer(second, 'teaser-only');
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'teaser-only', 'tile-only']);

  setFallbackConsumer(second);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'tile-only']);

  setFallbackConsumer(first);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'tile-only']);
  expect(usePredictionEventsStore.getState().enabled).toBe(true);
});

test('overlapping fallback consumers release independently and stop reads after the last exit', async () => {
  const { setFallbackConsumer } = usePredictionEventsStore.getState();
  setFallbackConsumer(first, 'shared');
  const unchanged = usePredictionEventsStore.getState().fallbackConsumers;
  setFallbackConsumer(first, 'shared');
  expect(usePredictionEventsStore.getState().fallbackConsumers).toBe(unchanged);
  setFallbackConsumer(second, 'shared');
  setFallbackConsumer(first);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared']);

  setFallbackConsumer(second, 'replacement');
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['replacement']);

  setFallbackConsumer(second);
  jest.clearAllMocks();
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(usePredictionEventsStore.getState().fallbackConsumers.size).toBe(0);
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  expect(fetchPolymarketEventsByIds).not.toHaveBeenCalled();
  expect(fetchPolymarketTeamMetadataForGameEvents).not.toHaveBeenCalled();
});

test('a newly registered fallback waits for its own request after an existing generic success', async () => {
  setRefs({ polymarket: ['existing-tile'] });
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(usePredictionEventsStore.getState().getStatus('isSuccess')).toBe(true);

  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback', first)).toEqual({
    event: undefined,
    error: null,
    isLoading: true,
  });
  usePredictionEventsStore.getState().setFallbackConsumer(first, 'new-fallback');
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback', first).isLoading).toBe(true);

  let finish: () => void = () => {
    throw new Error('Request did not start');
  };
  jest.mocked(fetchPolymarketEventsByIds).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = () => resolve([]);
      })
  );
  const pending = usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback', first).isLoading).toBe(true);
  finish();
  await pending;

  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback', first)).toEqual({
    event: undefined,
    error: null,
    isLoading: false,
  });
});

test('fallback failure is terminal for the failed request and does not leak into a newly requested ID', async () => {
  usePredictionEventsStore.getState().setFallbackConsumer(first, 'failed-fallback');
  const error = new Error('Gamma unavailable');
  jest.mocked(fetchPolymarketEventsByIds).mockRejectedValueOnce(error);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'failed-fallback', first)).toEqual({
    event: undefined,
    error,
    isLoading: false,
  });

  usePredictionEventsStore.getState().setFallbackConsumer(first, 'next-fallback');
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'next-fallback', first)).toEqual({
    event: undefined,
    error: null,
    isLoading: true,
  });
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'next-fallback', first).isLoading).toBe(false);
});
