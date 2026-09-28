import { afterAll, beforeEach, expect, test, vi } from 'vitest';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import { useDiscoverSurface, useDiscoverSurfacePlacementRefs } from './discoverSurfaceStore';

const { mockFirestoreDocuments } = await vi.hoisted(() => import('../../../../../config/test/firebase'));

const persistedSurface: SurfaceDocument = {
  id: 'discover',
  version: 1,
  enabled: true,
  items: [
    {
      id: 'sports',
      label: 'sports',
      enabled: true,
      items: [
        {
          id: 'daily_slate',
          label: 'daily_slate',
          enabled: true,
          placement: 'retired_sports',
          display: 'prediction_tile.carousel',
          destination: null,
        },
      ],
    },
    {
      id: 'featured',
      label: 'featured',
      enabled: true,
      items: [
        {
          id: 'sports',
          label: 'sports',
          enabled: true,
          placement: 'teasers',
          display: 'prediction_event_card.carousel',
          destination: null,
        },
        {
          id: 'event_list',
          label: 'event_list',
          enabled: true,
          placement: 'teasers',
          display: 'prediction_event_card.list',
          destination: null,
        },
        {
          id: 'predictions',
          label: 'predictions',
          enabled: true,
          placement: 'tiles',
          display: 'prediction_tile.grid',
          destination: ['predictions', 'sports'],
        },
      ],
    },
  ],
};

const placementsById: Record<string, Placement> = {
  teasers: { id: 'teasers', version: 2, source: 'polymarket', type: 'prediction', items: [{ id: 'shared' }, { id: 'teaser-only' }] },
  tiles: { id: 'tiles', version: 2, source: 'polymarket', type: 'prediction', items: [{ id: 'tile-only' }, { id: 'shared' }] },
};

beforeEach(async () => {
  mockFirestoreDocuments.clear();
  mockFirestoreDocuments.set('surfaces/discover', structuredClone(persistedSurface));
  for (const placement of Object.values(placementsById)) mockFirestoreDocuments.set(`placements/${placement.id}`, placement);
  await usePlacementsStore.getState().fetch(undefined, { force: true });
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
});
afterAll(() => {
  usePlacementsStore.getState().reset(true);
  getSurfaceStore('discover').getState().reset(true);
});

test('removes persisted Sports tabs and shares tile refs without hydrating event-card refs', () => {
  expect(useDiscoverSurface.getState()?.tabs.map(tab => tab.id)).toEqual(['featured']);
  expect(useDiscoverSurfacePlacementRefs.getState()).toEqual({
    hyperliquid: [],
    polymarket: ['shared', 'tile-only'],
    rainbow: [],
  });
});

test('a persisted Sports-only surface has no tabs or placement refs', async () => {
  mockFirestoreDocuments.set('surfaces/discover', { ...persistedSurface, items: [persistedSurface.items[0]] });
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
  expect(useDiscoverSurface.getState()).toBeUndefined();
  expect(useDiscoverSurfacePlacementRefs.getState()).toEqual({ hyperliquid: [], polymarket: [], rainbow: [] });
});
