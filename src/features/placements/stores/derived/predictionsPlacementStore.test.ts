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
const first = 'first';
const second = 'second';

beforeEach(() => {
  usePredictionEventsStore.setState({ fallbackEventIds: {} });
  setRefs({ polymarket: [] });
  jest.clearAllMocks();
  jest.mocked(fetchPolymarketEventsByIds).mockResolvedValue([]);
  jest.mocked(fetchPolymarketTeamMetadataForGameEvents).mockResolvedValue(new Map());
});

afterAll(() => usePredictionEventsStore.getState().reset(true));

test('no placement or fallback events means no Gamma or team hydration', async () => {
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(fetchPolymarketEventsByIds).not.toHaveBeenCalled();
  expect(fetchPolymarketTeamMetadataForGameEvents).not.toHaveBeenCalled();
});

test('fallback lists and placement events share one deduplicated event request', async () => {
  setRefs({ polymarket: ['tile-only', 'shared'] });
  const { setFallbackEventIds } = usePredictionEventsStore.getState();
  setFallbackEventIds(first, ['shared']);
  setFallbackEventIds(second, ['teaser-only']);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'teaser-only', 'tile-only']);

  setFallbackEventIds(second, []);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'tile-only']);

  setFallbackEventIds(first, []);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared', 'tile-only']);
  expect(usePredictionEventsStore.getState().enabled).toBe(true);
});

test('overlapping fallback lists release independently and stop reads after the last exit', async () => {
  const { setFallbackEventIds } = usePredictionEventsStore.getState();
  setFallbackEventIds(first, ['shared']);
  const unchanged = usePredictionEventsStore.getState().fallbackEventIds;
  setFallbackEventIds(first, ['shared']);
  expect(usePredictionEventsStore.getState().fallbackEventIds).toBe(unchanged);
  setFallbackEventIds(second, ['shared']);
  setFallbackEventIds(first, []);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['shared']);

  setFallbackEventIds(second, ['replacement']);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(jest.mocked(fetchPolymarketEventsByIds).mock.calls.at(-1)?.[0]).toEqual(['replacement']);

  setFallbackEventIds(second, []);
  jest.clearAllMocks();
  await usePredictionEventsStore.getState().fetch(undefined, { force: true });
  expect(usePredictionEventsStore.getState().fallbackEventIds).toEqual({});
  expect(usePredictionEventsStore.getState().enabled).toBe(false);
  expect(fetchPolymarketEventsByIds).not.toHaveBeenCalled();
  expect(fetchPolymarketTeamMetadataForGameEvents).not.toHaveBeenCalled();
});

test('a newly listed fallback waits for its own request after an existing placement success', async () => {
  setRefs({ polymarket: ['existing-tile'] });
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(usePredictionEventsStore.getState().getStatus('isSuccess')).toBe(true);

  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback')).toEqual({
    event: undefined,
    error: null,
    isLoading: true,
  });
  usePredictionEventsStore.getState().setFallbackEventIds(first, ['new-fallback']);
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback').isLoading).toBe(true);

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
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback').isLoading).toBe(true);
  finish();
  await pending;

  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'new-fallback')).toEqual({
    event: undefined,
    error: null,
    isLoading: false,
  });
});

test('a fallback failure stays with its request and does not leak into a newly listed event', async () => {
  usePredictionEventsStore.getState().setFallbackEventIds(first, ['failed-fallback']);
  const error = new Error('Gamma unavailable');
  jest.mocked(fetchPolymarketEventsByIds).mockRejectedValueOnce(error);
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'failed-fallback')).toEqual({
    event: undefined,
    error,
    isLoading: false,
  });

  usePredictionEventsStore.getState().setFallbackEventIds(first, ['next-fallback']);
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'next-fallback')).toEqual({
    event: undefined,
    error: null,
    isLoading: true,
  });
  await usePredictionEventsStore.getState().fetch(undefined, { force: true, updateQueryKey: true });
  expect(selectPredictionEvent(usePredictionEventsStore.getState(), 'next-fallback').isLoading).toBe(false);
});
