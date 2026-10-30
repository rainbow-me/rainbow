import { afterAll, beforeEach, expect, test, vi } from 'vitest';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import { createDiscoverPlacementRefsStore, useDiscoverSurface } from './discoverSurfaceStore';

const predictionRefs = createDiscoverPlacementRefsStore('polymarket');
const tokenRefs = createDiscoverPlacementRefsStore('rainbow');

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

test('removes persisted Sports tabs and shares refs across prediction displays', () => {
  expect(useDiscoverSurface.getState()?.tabs.map(tab => tab.id)).toEqual(['featured']);
  expect(predictionRefs.getState()).toEqual(['shared', 'teaser-only', 'tile-only']);
  expect(tokenRefs.getState()).toEqual([]);
});

test('a persisted Sports-only surface has no tabs or placement refs', async () => {
  mockFirestoreDocuments.set('surfaces/discover', { ...persistedSurface, items: [persistedSurface.items[0]] });
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
  expect(useDiscoverSurface.getState()).toBeUndefined();
  expect(predictionRefs.getState()).toEqual([]);
  expect(tokenRefs.getState()).toEqual([]);
});

test('surface and token refreshes preserve unchanged layout and prediction request IDs', async () => {
  const tokenPlacement: Placement = { id: 'tokens', version: 2, source: 'rainbow', type: 'token', items: [{ id: 'first:1' }] };
  mockFirestoreDocuments.set('placements/tokens', tokenPlacement);
  mockFirestoreDocuments.set('surfaces/discover', {
    ...persistedSurface,
    items: [
      ...persistedSurface.items,
      {
        id: 'tokens',
        label: 'Tokens',
        enabled: true,
        items: [{ id: 'tokens', label: 'Tokens', enabled: true, placement: 'tokens', display: 'market_tile.grid', destination: null }],
      },
    ],
  } satisfies SurfaceDocument);
  await usePlacementsStore.getState().fetch(undefined, { force: true });
  await getSurfaceStore('discover').getState().fetch(undefined, { force: true });
  const stops = [
    useDiscoverSurface.subscribe(() => undefined),
    predictionRefs.subscribe(() => undefined),
    tokenRefs.subscribe(() => undefined),
  ];

  try {
    const surface = useDiscoverSurface.getState();
    const predictions = predictionRefs.getState();
    expect(tokenRefs.getState()).toEqual(['first:1']);

    mockFirestoreDocuments.set('surfaces/discover', structuredClone(mockFirestoreDocuments.get('surfaces/discover')));
    await getSurfaceStore('discover').getState().fetch(undefined, { force: true });

    expect(useDiscoverSurface.getState()).toBe(surface);
    expect(predictionRefs.getState()).toBe(predictions);

    mockFirestoreDocuments.set('placements/tokens', { ...tokenPlacement, items: [{ id: 'second:1' }] });
    await usePlacementsStore.getState().fetch(undefined, { force: true });

    expect(useDiscoverSurface.getState()).toBe(surface);
    expect(predictionRefs.getState()).toBe(predictions);
    expect(tokenRefs.getState()).toEqual(['second:1']);
  } finally {
    for (const stop of stops) stop();
  }
});
