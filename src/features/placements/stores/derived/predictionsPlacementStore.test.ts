import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';

import '../../../../../config/test/storeEnvironment';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import { predictionEvent } from '../../../../../config/test/predictionEvent';
import { predictionEventsStore } from './predictionsPlacementStore';

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
      items: [
        { id: 'tiles', label: 'Predictions', enabled: true, placement: 'tiles', display: 'prediction_tile.grid', destination: null },
        { id: 'cards', label: 'Events', enabled: true, placement: 'cards', display: 'prediction_event_card.list', destination: null },
      ],
    },
    {
      id: 'next',
      label: 'Next',
      enabled: true,
      items: [
        { id: 'cards', label: 'Events', enabled: true, placement: 'next_cards', display: 'prediction_event_card.list', destination: null },
      ],
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

async function setPlacement(id: string, ids: string[]): Promise<void> {
  const placement: Placement = { id, version: 2, source: 'polymarket', type: 'prediction', items: ids.map(id => ({ id })) };
  mockFirestoreDocuments.set(`placements/${id}`, placement);
  await usePlacementsStore.getState().fetch(undefined, { force: true });
  await settle();
}

beforeEach(async () => {
  mockFirestoreDocuments.clear();
  mockFirestoreDocuments.set('surfaces/discover', surface);
  useExperimentalConfigStore.getState().setFlag(POLYMARKET, true);
  predictionEventsStore.setState({ events: {}, lastFetchedAt: null, error: null, status: 'idle' });
  fetchMock.mockReset().mockImplementation(
    async url =>
      new Response(JSON.stringify(new URL(String(url)).searchParams.getAll('id').map(predictionEvent)), {
        headers: { 'Content-Type': 'application/json' },
      })
  );
  await setPlacement('tiles', []);
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
});

afterEach(() => {
  for (const stop of stops.splice(0)) stop();
});
afterAll(() => {
  for (const store of [predictionEventsStore, usePlacementsStore, getSurfaceStore('discover')]) store.getState().reset(true);
  fetchMock.mockRestore();
});

test('shares events across prediction displays and retains them after a failed refresh', async () => {
  await setPlacement('tiles', ['shared', 'tile']);
  await setPlacement('cards', ['shared', 'other']);
  await setPlacement('next_cards', ['hidden']);
  stops.push(predictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(requestedIds()).toEqual([['hidden', 'other', 'shared', 'tile']]);
  const tile = predictionEventsStore.getState().events.tile;
  expect(tile?.markets[0].outcomes).toEqual(['Yes', 'No']);

  await setPlacement('cards', ['other', 'shared']);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fetchMock.mockRejectedValueOnce(new Error('Events unavailable'));
  await predictionEventsStore.getState().fetch(undefined, { force: true });
  expect(predictionEventsStore.getState().getStatus('isError')).toBe(true);
  expect(predictionEventsStore.getState().events.tile).toBe(tile);
  expect(predictionEventsStore.getState().events.unrequested).toBeUndefined();
});

test('removes a cached event after it closes', async () => {
  await setPlacement('cards', ['shared']);
  stops.push(predictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(predictionEventsStore.getState().events.shared?.id).toBe('shared');

  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify([{ ...predictionEvent('shared'), closed: true }]), { headers: { 'Content-Type': 'application/json' } })
  );
  await predictionEventsStore.getState().fetch(undefined, { force: true });
  expect(predictionEventsStore.getState().events.shared).toBeUndefined();
  expect(requestedIds()).toEqual([['shared'], ['shared']]);
});

test('distinguishes initial loading from an empty response', async () => {
  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  stops.push(predictionEventsStore.subscribe(() => undefined));
  expect(predictionEventsStore.getState().events.card).toBeUndefined();
  await setPlacement('cards', ['card']);
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(true);
  expect(predictionEventsStore.getState().events.card).toBeUndefined();

  response.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } }));
  await settle();
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(predictionEventsStore.getState().events.card).toBeUndefined();
});

test('retains loaded events when a request for new IDs fails', async () => {
  await setPlacement('cards', ['loaded', 'unavailable']);
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify([predictionEvent('loaded')]), { headers: { 'Content-Type': 'application/json' } })
  );
  stops.push(predictionEventsStore.subscribe(() => undefined));
  await settle();
  const loaded = predictionEventsStore.getState().events.loaded;
  expect(loaded?.id).toBe('loaded');
  expect(predictionEventsStore.getState().events.unavailable).toBeUndefined();

  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  await setPlacement('cards', ['loaded', 'unavailable', 'new']);
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(true);
  expect(predictionEventsStore.getState().events.loaded).toBe(loaded);
  expect(predictionEventsStore.getState().events.unavailable).toBeUndefined();
  expect(predictionEventsStore.getState().events.new).toBeUndefined();

  response.reject(new Error('Events unavailable'));
  await settle();
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(predictionEventsStore.getState().getStatus('isError')).toBe(true);
  expect(predictionEventsStore.getState().events.loaded).toBe(loaded);
  expect(predictionEventsStore.getState().events.unavailable).toBeUndefined();
  expect(predictionEventsStore.getState().events.new).toBeUndefined();

  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify([predictionEvent('loaded'), predictionEvent('new')]), { headers: { 'Content-Type': 'application/json' } })
  );
  await predictionEventsStore.getState().fetch(undefined, { force: true });
  expect(predictionEventsStore.getState().events.new?.id).toBe('new');
  expect(predictionEventsStore.getState().events.unavailable).toBeUndefined();
});

test('starts initial loading for new IDs after a failed request', async () => {
  await setPlacement('cards', ['failed']);
  fetchMock.mockRejectedValueOnce(new Error('Events unavailable'));
  stops.push(predictionEventsStore.subscribe(() => undefined));
  await settle();
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(predictionEventsStore.getState().getStatus('isError')).toBe(true);
  expect(predictionEventsStore.getState().events.failed).toBeUndefined();
  expect(predictionEventsStore.getState().events.new).toBeUndefined();

  const response = Promise.withResolvers<Response>();
  fetchMock.mockReturnValueOnce(response.promise);
  await setPlacement('cards', ['new']);
  expect(predictionEventsStore.getState().getStatus('isInitialLoad')).toBe(true);
  expect(predictionEventsStore.getState().events.new).toBeUndefined();

  response.resolve(new Response(JSON.stringify([predictionEvent('new')]), { headers: { 'Content-Type': 'application/json' } }));
  await settle();
  expect(predictionEventsStore.getState().events.new?.id).toBe('new');
});
