import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';

import '../../../../../config/test/storeEnvironment';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { useDiscoverNavigationStore } from '@/features/discover/stores/discoverNavigationStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import { predictionEvent } from '../../../../../config/test/predictionEvent';
import {
  predictionCardEventsStore,
  predictionTileEventsStore,
  useHasDiscoverEventsError,
  usePredictionEventsStore,
} from './predictionsPlacementStore';

const { mockFirestoreDocuments } = await vi.hoisted(() => import('../../../../../config/test/firebase'));

// Event colors are presentation data; these tests exercise request sharing and availability.
vi.mock('@/hooks/useAccountAccentColor', () => ({ getHighContrastColor: (color: string) => color }));
vi.mock('@/features/polymarket/utils/getMarketColor', () => ({
  getMarketColors: (_market: unknown, color: unknown) => ({ color, secondaryColor: undefined }),
}));

const fetchMock = vi.spyOn(global, 'fetch');
const stops: (() => void)[] = [];
const surface: SurfaceDocument = {
  id: 'discover',
  version: 1,
  enabled: true,
  items: [
    {
      id: 'featured',
      label: 'Featured',
      enabled: true,
      items: [{ id: 'tiles', label: 'Predictions', enabled: true, placement: 'tiles', display: 'prediction_tile.grid', destination: null }],
    },
  ],
};

function requestedIds(): string[][] {
  return fetchMock.mock.calls.map(([url]) => new URL(String(url)).searchParams.getAll('id'));
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

async function setTiles(ids: string[]): Promise<void> {
  const placement: Placement = { id: 'tiles', version: 2, source: 'polymarket', type: 'prediction', items: ids.map(id => ({ id })) };
  mockFirestoreDocuments.set('placements/tiles', placement);
  await usePlacementsStore.getState().fetch(undefined, { force: true });
  await settle();
}

beforeEach(async () => {
  mockFirestoreDocuments.clear();
  mockFirestoreDocuments.set('surfaces/discover', surface);
  discoverEventListsStore.setState(discoverEventListsStore.getInitialState());
  useDiscoverNavigationStore.getState().navigate('featured');
  useExperimentalConfigStore.getState().setFlag(POLYMARKET, true);
  for (const store of [predictionTileEventsStore, predictionCardEventsStore])
    store.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  fetchMock.mockReset().mockImplementation(
    async url =>
      new Response(JSON.stringify(new URL(String(url)).searchParams.getAll('id').map(predictionEvent)), {
        headers: { 'Content-Type': 'application/json' },
      })
  );
  await setTiles([]);
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
});

afterEach(() => {
  for (const stop of stops.splice(0)) stop();
});
afterAll(() => {
  for (const store of [predictionTileEventsStore, predictionCardEventsStore, usePlacementsStore, getSurfaceStore('discover')])
    store.getState().reset(true);
  fetchMock.mockRestore();
});

test('shares tile requests while card sections change and fail independently', async () => {
  await setTiles(['shared', 'tile']);
  discoverEventListsStore.getState().setList('featured', 'cards', ['shared', 'other']);
  discoverEventListsStore.getState().setList('next', 'cards', ['hidden']);
  stops.push(usePredictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(requestedIds()).toEqual(expect.arrayContaining([['shared', 'tile'], ['other']]));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const tile = usePredictionEventsStore.getState()('tile');
  expect(tile?.markets[0].outcomes).toEqual(['Yes', 'No']);

  discoverEventListsStore.getState().setList('featured', 'cards', ['other', 'shared']);
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fetchMock.mockRejectedValueOnce(new Error('Cards unavailable'));
  useDiscoverNavigationStore.getState().navigate('next');
  await settle();
  expect(requestedIds().at(-1)).toEqual(['hidden']);
  expect(useHasDiscoverEventsError.getState()).toBe(true);
  expect(usePredictionEventsStore.getState()('hidden')).toBeNull();
  expect(usePredictionEventsStore.getState()('unregistered')).toBeUndefined();
  expect(usePredictionEventsStore.getState()('tile')).toBe(tile);
});

test('a tile response retires an event previously loaded for a card', async () => {
  discoverEventListsStore.getState().setList('featured', 'cards', ['shared']);
  stops.push(usePredictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(usePredictionEventsStore.getState()('shared')?.id).toBe('shared');

  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify([{ ...predictionEvent('shared'), closed: true }]), { headers: { 'Content-Type': 'application/json' } })
  );
  await setTiles(['shared']);
  expect(usePredictionEventsStore.getState()('shared')).toBeNull();
  expect(requestedIds()).toEqual([['shared'], ['shared']]);
});

test('a card remains pending until registration and its response determine availability', async () => {
  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  stops.push(usePredictionEventsStore.subscribe(() => undefined));
  expect(usePredictionEventsStore.getState()('card')).toBeUndefined();
  discoverEventListsStore.getState().setList('featured', 'cards', ['card']);
  await settle();
  expect(usePredictionEventsStore.getState()('card')).toBeUndefined();

  response.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } }));
  await settle();
  expect(usePredictionEventsStore.getState()('card')).toBeNull();
});

test('retains available and unavailable cards while fetching newly displayed events', async () => {
  discoverEventListsStore.getState().setList('featured', 'cards', ['loaded', 'unavailable']);
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify([predictionEvent('loaded')]), { headers: { 'Content-Type': 'application/json' } })
  );
  stops.push(usePredictionEventsStore.subscribe(() => undefined));
  await settle();
  const loaded = usePredictionEventsStore.getState()('loaded');
  expect(loaded?.id).toBe('loaded');
  expect(usePredictionEventsStore.getState()('unavailable')).toBeNull();

  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  discoverEventListsStore.getState().setList('featured', 'cards', ['loaded', 'unavailable', 'new']);
  await settle();
  expect(usePredictionEventsStore.getState()('loaded')).toBe(loaded);
  expect(usePredictionEventsStore.getState()('unavailable')).toBeNull();
  expect(usePredictionEventsStore.getState()('new')).toBeUndefined();

  response.resolve(
    new Response(JSON.stringify([predictionEvent('loaded'), predictionEvent('new')]), { headers: { 'Content-Type': 'application/json' } })
  );
  await settle();
  expect(usePredictionEventsStore.getState()('new')?.id).toBe('new');
  expect(usePredictionEventsStore.getState()('unavailable')).toBeNull();
});

test('does not apply a failed request to newly displayed events', async () => {
  discoverEventListsStore.getState().setList('featured', 'cards', ['failed']);
  fetchMock.mockRejectedValueOnce(new Error('Cards unavailable'));
  stops.push(usePredictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(usePredictionEventsStore.getState()('failed')).toBeNull();
  expect(usePredictionEventsStore.getState()('new')).toBeUndefined();

  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  discoverEventListsStore.getState().setList('featured', 'cards', ['new']);
  expect(usePredictionEventsStore.getState()('new')).toBeUndefined();
  await settle();
  expect(usePredictionEventsStore.getState()('new')).toBeUndefined();

  response.resolve(new Response(JSON.stringify([predictionEvent('new')]), { headers: { 'Content-Type': 'application/json' } }));
  await settle();
  expect(usePredictionEventsStore.getState()('new')?.id).toBe('new');
});
