import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';

import { FIXTURE_V2_PLACEMENTS, FIXTURE_V2_PLACEMENTS_BY_ID } from '../__fixtures__/placements';
import { PLACEMENT_IDS, PLACEMENT_IDS_BY_SURFACE, PLACEMENT_SURFACES } from '../constants';
import { type Placement, type PlacementId } from '../types';
import { fetchPlacements, usePlacementsStore } from './placementsStore';

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

  it('fetches only enabled v2 Discover placement documents from Firestore', async () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc(perps)],
    });

    const placementsById = await fetchPlacements();

    expect(getFirestore).toHaveBeenCalledWith('app');
    expect(collection).toHaveBeenCalledWith('db', 'placements');
    expect(where).toHaveBeenCalledWith('enabled', '==', true);
    expect(where).toHaveBeenCalledWith('version', '==', 2);
    expect(where).toHaveBeenCalledWith('surfaces', 'array-contains', PLACEMENT_SURFACES.DISCOVER);
    expect(query).toHaveBeenCalledWith(
      'placementsRef',
      { field: 'enabled', operator: '==', value: true },
      { field: 'version', operator: '==', value: 2 },
      { field: 'surfaces', operator: 'array-contains', value: PLACEMENT_SURFACES.DISCOVER }
    );
    expect(placementsById[PLACEMENT_IDS.PERPS]?.id).toBe(PLACEMENT_IDS.PERPS);
  });

  it('projects the live-shaped v2 fixtures keyed by placement id', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: FIXTURE_V2_PLACEMENTS.map(placement => createPlacementDoc(placement)),
    });

    const placementsById = await fetchPlacements();

    expect(Object.keys(placementsById)).toEqual(PLACEMENT_IDS_BY_SURFACE[PLACEMENT_SURFACES.DISCOVER]);
    expect(placementsById[PLACEMENT_IDS.PERPS]?.items.map(item => item.order)).toEqual(
      [...(placementsById[PLACEMENT_IDS.PERPS]?.items ?? [])].map(item => item.order).sort((a, b) => a - b)
    );
  });

  it('filters ref ids by source, type, and source plus type', () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    expect(usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, { source: 'hyperliquid' })).toEqual(
      expect.arrayContaining(['BTC', 'ETH', 'SOL'])
    );
    expect(usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, { type: 'perp' })).toEqual(
      usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, { source: 'hyperliquid', type: 'perp' })
    );
    expect(usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, { source: 'polymarket', type: 'prediction' })).toEqual([]);
  });

  it('unions and dedupes ref ids across all v2 placements', () => {
    const duplicatePrediction = '27830';
    const placementsById = {
      ...FIXTURE_V2_PLACEMENTS_BY_ID,
      [PLACEMENT_IDS.PREDICTIONS]: {
        ...FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS],
        items: [
          ...(FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS]?.items ?? []),
          { order: 99, ref: { source: 'polymarket', type: 'prediction', id: duplicatePrediction } },
        ],
      },
    } as Partial<Record<PlacementId, Placement>>;

    usePlacementsStore.setState({ placementsById });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    expect(eventIds.filter(id => id === duplicatePrediction)).toHaveLength(1);
    expect(eventIds).toEqual([...eventIds].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  });

  it('returns enabled categories sorted by category order', () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    expect(usePlacementsStore.getState().getCategories(PLACEMENT_IDS.PREDICTIONS_SPORTS)).toEqual([
      { order: 0, category: 'sport_nba', enabled: true },
    ]);
    expect(usePlacementsStore.getState().getCategories(PLACEMENT_IDS.PREDICTIONS)).toEqual([]);
  });

  it('ignores disabled, v1, future-version, non-Discover, and mismatched-id documents for client/schema compatibility', async () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        createPlacementDoc(createV1Placement(), 'discover_featured_perps_carousel'),
        createPlacementDoc(perps),
        createPlacementDoc({ ...perps, enabled: false }),
        createPlacementDoc({ ...perps, version: 3 } as unknown as Placement),
        createPlacementDoc({ ...perps, surfaces: ['wallet'] } as unknown as Placement),
        createPlacementDoc({ ...perps, id: PLACEMENT_IDS.PREDICTIONS }, PLACEMENT_IDS.PERPS),
        createPlacementDoc({ ...perps, id: 'future_placement' } as unknown as Placement, 'future_placement'),
      ],
    });

    const placementsById = await fetchPlacements();

    expect(Object.keys(placementsById)).toEqual([PLACEMENT_IDS.PERPS]);
    expect(placementsById[PLACEMENT_IDS.PERPS]?.version).toBe(2);
  });

  it('does not leak stale v1 cached placements into v2 selectors', () => {
    usePlacementsStore.setState({
      placementsById: {
        ...FIXTURE_V2_PLACEMENTS_BY_ID,
        discover_featured_predictions_carousel: createV1Placement(),
      } as unknown as Partial<Record<PlacementId, Placement>>,
    });

    expect(usePlacementsStore.getState().getAllRefIds({ source: 'polymarket' })).not.toContain('legacy-event');
    expect(usePlacementsStore.getState().getItemsBySource('discover_featured_predictions_carousel' as PlacementId, 'polymarket')).toEqual(
      []
    );
  });

  it('does not leak mismatched or unknown future cached placements into v2 selectors', () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    usePlacementsStore.setState({
      placementsById: {
        [PLACEMENT_IDS.PERPS]: { ...perps, id: PLACEMENT_IDS.PREDICTIONS },
        future_placement: {
          ...perps,
          id: 'future_placement',
          items: [{ order: 0, ref: { source: 'hyperliquid', type: 'perp', id: 'FUTURE' } }],
        },
      } as unknown as Partial<Record<PlacementId, Placement>>,
    });

    expect(usePlacementsStore.getState().getPlacement(PLACEMENT_IDS.PERPS)).toBeUndefined();
    expect(usePlacementsStore.getState().getPlacement('future_placement' as PlacementId)).toBeUndefined();
    expect(usePlacementsStore.getState().getRefIds('future_placement' as PlacementId, { source: 'hyperliquid' })).toEqual([]);
    expect(usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, { source: 'hyperliquid' })).toEqual([]);
    expect(usePlacementsStore.getState().getAllRefIds({ source: 'hyperliquid' })).not.toContain('FUTURE');
  });

  it('tolerates unknown future item refs without matching current filters', () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    usePlacementsStore.setState({
      placementsById: {
        [PLACEMENT_IDS.PERPS]: {
          ...perps,
          items: [
            ...perps.items,
            { order: 99, ref: { source: 'future', type: 'future', id: 'future-ref' } },
            { order: 100, ref: { source: 'hyperliquid', type: 'prediction', id: 'mismatched-ref' } },
          ],
        } as unknown as Placement,
      },
    });

    expect(() => usePlacementsStore.getState().getAllRefIds({ type: 'perp' })).not.toThrow();
    expect(usePlacementsStore.getState().getAllRefIds({ type: 'perp' })).not.toContain('future-ref');
    expect(usePlacementsStore.getState().getAllRefIds({ source: 'hyperliquid' })).not.toContain('mismatched-ref');
    expect(usePlacementsStore.getState().getAllRefIds({})).not.toContain('future-ref');
    expect(usePlacementsStore.getState().getAllRefIds({})).not.toContain('mismatched-ref');
  });

  it('drops malformed live document items before sorting and storing a placement', async () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    const placement = {
      ...perps,
      items: [
        { order: 2, ref: { source: 'hyperliquid', type: 'perp', id: 'ETH' } },
        null,
        { order: 1 },
        { order: 0, ref: { source: 'future', type: 'future', id: 'FUTURE' } },
        { order: 4, ref: { source: 'hyperliquid', type: 'prediction', id: 'MISMATCHED' } },
        { order: 3, ref: { source: 'hyperliquid', type: 'perp', id: '' } },
        { order: 1, ref: { source: 'hyperliquid', type: 'perp', id: 'BTC' } },
      ],
    } as unknown as Placement;

    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [createPlacementDoc(placement)],
    });

    const placementsById = await fetchPlacements();

    expect(placementsById[PLACEMENT_IDS.PERPS]?.items.map(item => item.ref.id)).toEqual(['BTC', 'ETH']);
  });

  it('ignores malformed items with missing refs when collecting unfiltered ref ids', () => {
    const perps = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PERPS];
    if (!perps) throw new Error('Missing perps fixture');

    usePlacementsStore.setState({
      placementsById: {
        [PLACEMENT_IDS.PERPS]: {
          ...perps,
          items: [...perps.items, { order: 99 }, null],
        } as unknown as Placement,
      },
    });

    expect(() => usePlacementsStore.getState().getAllRefIds({})).not.toThrow();
    expect(() => usePlacementsStore.getState().getItemsBySource(PLACEMENT_IDS.PERPS, 'hyperliquid')).not.toThrow();
    expect(usePlacementsStore.getState().getAllRefIds({})).toEqual(usePlacementsStore.getState().getRefIds(PLACEMENT_IDS.PERPS, {}));
  });

  it('ignores malformed cached categories', () => {
    const sports = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS_SPORTS];
    if (!sports) throw new Error('Missing sports fixture');

    usePlacementsStore.setState({
      placementsById: {
        [PLACEMENT_IDS.PREDICTIONS_SPORTS]: {
          ...sports,
          categories: [
            null,
            { enabled: true },
            { order: 2, category: 'sport_mlb', enabled: true },
            { order: Number.NaN, category: 'sport_nhl', enabled: true },
            { order: 0, category: 'sport_nba', enabled: true },
            { order: 1, category: '', enabled: true },
            { order: 3, category: 'sport_nfl', enabled: false },
          ],
        } as unknown as Placement,
      },
    });

    expect(() => usePlacementsStore.getState().getCategories(PLACEMENT_IDS.PREDICTIONS_SPORTS)).not.toThrow();
    expect(usePlacementsStore.getState().getCategories(PLACEMENT_IDS.PREDICTIONS_SPORTS)).toEqual([
      { order: 0, category: 'sport_nba', enabled: true },
      { order: 2, category: 'sport_mlb', enabled: true },
    ]);
  });
});

function createPlacementDoc(placement: unknown, id = (placement as { id?: string }).id ?? 'unknown') {
  return {
    id,
    data: () => placement,
  };
}

function createV1Placement() {
  return {
    id: 'discover_featured_predictions_carousel',
    screen: 'discover',
    enabled: true,
    order: 1,
    version: 1,
    updatedAt: '2026-05-15T15:59:08.900Z',
    items: [{ order: 0, ref: { source: 'polymarket', id: 'legacy-event' }, metadata: { title: 'Legacy event' } }],
  };
}
