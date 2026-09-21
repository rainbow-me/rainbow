import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import { useDiscoverSurface, useDiscoverSurfaceInput, useDiscoverSurfacePlacementRefs } from './discoverSurfaceStore';
import { getMissingSurfacePlacementIds, isSurfaceWaitingForPlacements, surfaceContainsPlacement } from './discoverSurfaceTransforms';

jest.mock('@/features/placements/surfaces/stores/surfaceStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  const store = createBaseStore(() => ({ getData: () => undefined, lastFetchedAt: null }));
  return { getSurfaceStore: () => store };
});
jest.mock('@/features/placements/stores/placementsStore', () => ({
  usePlacementsStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({
    placementsById: {},
    lastFetchedAt: null,
    getStatus: (status: string) => status === 'isSuccess',
  })),
}));
jest.mock('@/logger', () => ({ logger: { warn: jest.fn() } }));

const persistedSurface: SurfaceDocument = {
  id: 'discover',
  version: 1,
  enabled: true,
  items: [
    {
      id: 'sports',
      enabled: true,
      items: [{ id: 'daily_slate', enabled: true, placement: 'retired_sports', display: 'prediction_tile.carousel', destination: null }],
    },
    {
      id: 'featured',
      enabled: true,
      items: [
        { id: 'sports', enabled: true, placement: 'teasers', display: 'prediction_event_card.carousel', destination: null },
        { id: 'event_list', enabled: true, placement: 'teasers', display: 'prediction_event_card.list', destination: null },
        { id: 'predictions', enabled: true, placement: 'tiles', display: 'prediction_tile.grid', destination: ['predictions', 'sports'] },
      ],
    },
  ],
};

const placementsById: Record<string, Placement> = {
  teasers: { id: 'teasers', version: 2, source: 'polymarket', type: 'prediction', items: [{ id: 'shared' }, { id: 'teaser-only' }] },
  tiles: { id: 'tiles', version: 2, source: 'polymarket', type: 'prediction', items: [{ id: 'tile-only' }, { id: 'shared' }] },
};

beforeEach(() => {
  getSurfaceStore('discover').setState({ getData: () => persistedSurface, lastFetchedAt: 20 });
  usePlacementsStore.setState({ placementsById, lastFetchedAt: 10 });
});

test('cached raw Sports leaves never reach missing-placement, waiting, containment, or tab projections', () => {
  expect(getMissingSurfacePlacementIds(persistedSurface, placementsById)).toEqual(['retired_sports']);
  const input = useDiscoverSurfaceInput.getState();
  expect(input.lastFetchedAt).toBe(20);
  expect(input.surface?.items.map(item => item.id)).toEqual(['featured']);
  expect(getSurfaceStore('discover').getState().getData()).toBe(persistedSurface);
  expect(persistedSurface.items[0].id).toBe('sports');
  if (!input.surface) throw new Error('Expected the retained Featured tab');

  expect(getMissingSurfacePlacementIds(input.surface, placementsById)).toEqual([]);
  expect(isSurfaceWaitingForPlacements(input.surface, placementsById, 20, 10)).toBe(false);
  expect(surfaceContainsPlacement(input.surface, 'retired_sports')).toBe(false);
  expect(surfaceContainsPlacement(input.surface, 'teasers')).toBe(true);
  expect(useDiscoverSurface.getState()?.tabs.map(tab => tab.id)).toEqual(['featured']);
});

test('event-card displays do not hydrate generic refs or remove a shared generic tile ref', () => {
  expect(useDiscoverSurfacePlacementRefs.getState()).toEqual({
    hyperliquid: [],
    polymarket: ['shared', 'tile-only'],
    rainbow: [],
  });
});

test('retained missing placements still wait, while a Sports-only persisted surface becomes empty', () => {
  usePlacementsStore.setState({ placementsById: {} });
  const input = useDiscoverSurfaceInput.getState();
  if (!input.surface) throw new Error('Expected the retained Featured tab');
  expect(getMissingSurfacePlacementIds(input.surface, {})).toEqual(['teasers', 'tiles']);
  expect(isSurfaceWaitingForPlacements(input.surface, {}, 20, 10)).toBe(true);

  getSurfaceStore('discover').setState({ getData: () => ({ ...persistedSurface, items: [persistedSurface.items[0]] }) });
  expect(useDiscoverSurfaceInput.getState().surface).toBeUndefined();
  expect(useDiscoverSurface.getState()).toBeUndefined();
  expect(useDiscoverSurfacePlacementRefs.getState()).toEqual({ hyperliquid: [], polymarket: [], rainbow: [] });
});
