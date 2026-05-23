import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

import { type Placement } from '../types';
import { fetchPlacements, usePlacementsStore, type PlacementsById } from './placementsStore';

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => 'app'),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(() => 'placementsRef'),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => 'db'),
  query: jest.fn(() => 'placementsQuery'),
  where: jest.fn((field: string, operator: string, value: unknown) => ({ field, operator, value })),
}));

describe('placementsStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
    usePlacementsStore.setState({ placementsById: {} });
    usePlacementsStore.getState().reset(true);
  });

  it('fetches v2 placement documents from Firestore', async () => {
    const perps = getPlacement('perps_top');

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc(perps)],
    });

    const placementsById = await fetchPlacements();

    expect(getFirestore).toHaveBeenCalledWith('app');
    expect(collection).toHaveBeenCalledWith('db', 'placements');
    expect(where).toHaveBeenCalledWith('version', '==', 2);
    expect(query).toHaveBeenCalledWith('placementsRef', { field: 'version', operator: '==', value: 2 });
    expect(placementsById.perps_top?.id).toBe('perps_top');
  });

  it('projects live-shaped v2 documents keyed by placement id', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: Object.values(TEST_PLACEMENTS_BY_ID).map(placement => createPlacementDoc(placement)),
    });

    const placementsById = await fetchPlacements();

    expect(Object.keys(placementsById).sort()).toEqual(Object.keys(TEST_PLACEMENTS_BY_ID).sort());
    expect(placementsById.perps_top?.items.slice(0, 3)).toEqual([{ id: 'BTC' }, { id: 'ETH' }, { id: 'SOL' }]);
  });

  it('filters ref ids by placement source and type', () => {
    usePlacementsStore.setState({ placementsById: TEST_PLACEMENTS_BY_ID });

    expect(usePlacementsStore.getState().getRefIds('perps_top', { source: 'hyperliquid' })).toEqual(
      expect.arrayContaining(['BTC', 'ETH', 'SOL'])
    );
    expect(usePlacementsStore.getState().getRefIds('perps_top', { type: 'perp' })).toEqual(
      usePlacementsStore.getState().getRefIds('perps_top', { source: 'hyperliquid', type: 'perp' })
    );
    expect(usePlacementsStore.getState().getRefIds('perps_top', { source: 'polymarket', type: 'prediction' })).toEqual([]);
  });

  it('unions and dedupes ref ids across all placements', () => {
    const duplicatePrediction = 'event-1';
    const predictions = getPlacement('predictions');
    const placementsById: PlacementsById = {
      ...TEST_PLACEMENTS_BY_ID,
      predictions: {
        ...predictions,
        items: [...predictions.items, { id: duplicatePrediction }],
      },
    };

    usePlacementsStore.setState({ placementsById });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    expect(eventIds.filter(id => id === duplicatePrediction)).toHaveLength(1);
    expect(eventIds).toEqual([...eventIds].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  });

  it('replaces cached placements with the latest successful v2 fetch', async () => {
    const cachedPerps = getPlacement('perps_top');
    const cachedPredictions = getPlacement('predictions');
    const refreshedPerps: Placement = {
      ...cachedPerps,
      items: [{ id: 'HYPE' }, { id: 'BTC' }],
    };

    usePlacementsStore.setState({
      placementsById: {
        [cachedPerps.id]: cachedPerps,
        [cachedPredictions.id]: cachedPredictions,
      },
    });
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc(refreshedPerps)],
    });

    await usePlacementsStore.getState().fetch(undefined, { force: true });

    expect(usePlacementsStore.getState().getRefIds('perps_top', { source: 'hyperliquid', type: 'perp' })).toEqual(['BTC', 'HYPE']);
    expect(usePlacementsStore.getState().getPlacement('predictions')).toBeUndefined();
  });

  it('ignores stale v1, mismatched, malformed, and future cached placements', () => {
    const perps = getPlacement('perps_top');
    const placementsById = {
      perps_top: { ...perps, id: 'other_id' },
      v1_predictions: createV1Placement(),
      future_placement: { ...perps, id: 'future_placement', version: 3 },
      bad_items: { ...perps, id: 'bad_items', items: [{ id: '' }, null] },
    } as unknown as PlacementsById;

    usePlacementsStore.setState({ placementsById });

    expect(usePlacementsStore.getState().getPlacement('perps_top')).toBeUndefined();
    expect(usePlacementsStore.getState().getAllRefIds({ source: 'hyperliquid' })).toEqual([]);
    expect(usePlacementsStore.getState().getItemsBySource('bad_items', 'hyperliquid')).toEqual([]);
  });

  it('drops malformed live document items before storing a placement', async () => {
    const perps = getPlacement('perps_top');
    const placement = {
      ...perps,
      items: [{ id: 'ETH' }, null, { id: '' }, { id: 'BTC' }, { ref: { id: 'OLD' } }],
    } as unknown as Placement;

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc(placement)],
    });

    const placementsById = await fetchPlacements();

    expect(placementsById.perps_top?.items).toEqual([{ id: 'ETH' }, { id: 'BTC' }]);
  });

  it('returns an empty map when Firestore has no valid placement documents', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc({ id: 'bad_pair', version: 2, source: 'hyperliquid', type: 'prediction', items: [{ id: 'BTC' }] })],
    });

    const placementsById = await fetchPlacements();

    expect(placementsById).toEqual({});
  });

  it('ignores documents whose source/type pair is not part of the v2 schema', async () => {
    const perps = getPlacement('perps_top');

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        createPlacementDoc(perps),
        createPlacementDoc({ ...perps, id: 'bad_pair', source: 'hyperliquid', type: 'prediction' }),
        createPlacementDoc({ ...perps, id: 'bad_source', source: 'future', type: 'perp' }),
        createPlacementDoc({ ...perps, id: 'bad_version', version: 1 }),
        createPlacementDoc({ ...perps, id: 'wrong_doc_id' }, 'different_doc_id'),
      ],
    });

    const placementsById = await fetchPlacements();

    expect(Object.keys(placementsById)).toEqual(['perps_top']);
  });
});

const TEST_PLACEMENTS_BY_ID: PlacementsById = {
  perps_top: {
    id: 'perps_top',
    version: 2,
    source: 'hyperliquid',
    type: 'perp',
    items: [{ id: 'BTC' }, { id: 'ETH' }, { id: 'SOL' }],
  },
  predictions: {
    id: 'predictions',
    version: 2,
    source: 'polymarket',
    type: 'prediction',
    items: [{ id: 'event-1' }, { id: 'event-2' }],
  },
  tokens_top: {
    id: 'tokens_top',
    version: 2,
    source: 'rainbow',
    type: 'token',
    items: [{ id: 'eth:1' }],
  },
};

function getPlacement(id: string): Placement {
  const placement = TEST_PLACEMENTS_BY_ID[id];
  if (!placement) throw new Error(`Missing test placement: ${id}`);
  return placement;
}

function createPlacementDoc(placement: unknown, id = (placement as { id?: string }).id ?? 'unknown') {
  return {
    id,
    data: () => placement,
  };
}

function createV1Placement() {
  return {
    id: 'v1_predictions',
    screen: 'discover',
    enabled: true,
    order: 1,
    version: 1,
    updatedAt: '2026-05-15T15:59:08.900Z',
    items: [{ order: 0, ref: { source: 'polymarket', id: 'legacy-event' } }],
  };
}
