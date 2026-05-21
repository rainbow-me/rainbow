import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';

import { FIXTURE_V2_PLACEMENTS_BY_ID } from '../../__fixtures__/placements';
import { PLACEMENT_IDS } from '../../constants';
import { type Placement } from '../../types';
import { fetchPlacements, usePlacementsStore } from '../placementsStore';
import { usePredictionEventsStore, usePredictionsPlacementStore, usePredictionsSportsGroupsStore } from './predictionsPlacementStore';

jest.mock('@/env', () => ({
  ...jest.requireActual('@/env'),
  IS_TEST: false,
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => 'app'),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getFirestore: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/model/remoteConfig', () => ({
  useRemoteConfigStore: mockCreateStore({
    config: {
      discover_placements_enabled: true,
      polymarket_enabled: false,
    },
    getRemoteConfigKey(this: { config: Record<string, boolean> }, key: string) {
      return this.config[key];
    },
    isConfigReady: () => true,
  }),
}));

jest.mock('@/config/experimentalConfigStore', () => ({
  useExperimentalConfigStore: mockCreateStore({
    config: {
      [jest.requireActual<typeof import('@/config/experimental')>('@/config/experimental').POLYMARKET]: false,
    },
    getFlag(this: { config: Record<string, boolean> }, key: string) {
      return this.config[key];
    },
  }),
}));

jest.mock('@/features/polymarket/stores/polymarketEventsStore', () => ({
  fetchPolymarketEventsByIds: jest.fn(),
}));

jest.mock('@/features/polymarket/utils/transforms', () => ({
  processRawPolymarketEvent: jest.fn(event => event),
}));

describe('predictionsPlacementStore', () => {
  beforeEach(() => {
    (fetchPolymarketEventsByIds as jest.Mock).mockImplementation((eventIds: string[]) =>
      Promise.resolve(eventIds.map(eventId => createEvent(eventId)))
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    usePlacementsStore.setState({ placementsById: {} });
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: false,
      },
    }));
    useExperimentalConfigStore.setState(state => ({
      config: {
        ...state.config,
        [POLYMARKET]: false,
      },
    }));
    usePlacementsStore.getState().reset(true);
    usePredictionEventsStore.getState().reset(true);
  });

  it('fetches a deduped event-id union across all polymarket prediction placements', async () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const expectedEventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds: expectedEventIds }, { force: true });

    const eventIds = (fetchPolymarketEventsByIds as jest.Mock).mock.calls[0]?.[0] as string[];
    expect(eventIds).toEqual([...new Set(eventIds)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
    expect(eventIds).toEqual(expect.arrayContaining(['27830', '32754']));
    expect(processRawPolymarketEvent).toHaveBeenCalled();
  });

  it('hydrates the predictions placement from fetched events', async () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    const placement = usePredictionsPlacementStore.getState();
    expect(placement.placement?.id).toBe(PLACEMENT_IDS.PREDICTIONS);
    expect(placement.items).toHaveLength(FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS].items.length);
  });

  it('filters resolved prediction events out of placements', async () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });
    (fetchPolymarketEventsByIds as jest.Mock).mockImplementation((eventIds: string[]) =>
      Promise.resolve(
        eventIds.map(eventId =>
          createEvent(
            eventId,
            undefined,
            eventId === FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS].items[0].ref.id ? { closed: true } : {}
          )
        )
      )
    );

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    expect(usePredictionsPlacementStore.getState().items).toHaveLength(
      FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS].items.length - 1
    );
    expect(usePredictionsPlacementStore.getState().items).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ closed: true }) })])
    );
  });

  it('filters events with only resolved markets out of placements', async () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });
    (fetchPolymarketEventsByIds as jest.Mock).mockImplementation((eventIds: string[]) =>
      Promise.resolve(
        eventIds.map(eventId =>
          createEvent(
            eventId,
            eventId === FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS].items[0].ref.id
              ? [
                  {
                    id: eventId,
                    question: `Market ${eventId}`,
                    slug: eventId,
                    active: false,
                    closed: true,
                    umaResolutionStatus: 'resolved',
                  },
                ]
              : undefined
          )
        )
      )
    );

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    expect(usePredictionsPlacementStore.getState().items).toHaveLength(
      FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS].items.length - 1
    );
  });

  it('returns an empty placement result when the polymarket gate is off', () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    expect(usePredictionsPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });

  it('groups sports predictions by enabled placement categories', async () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    expect(usePredictionsSportsGroupsStore.getState()).toEqual({
      groups: [
        {
          category: { order: 0, category: 'sport_nba', enabled: true },
          items: expect.arrayContaining([expect.objectContaining({ ref: expect.objectContaining({ category: 'sport_nba' }) })]),
        },
      ],
      isLoading: false,
    });
  });

  it('reports sports groups loading while the sports placement has not hydrated', async () => {
    let resolveEvents: (events: PolymarketEvent[]) => void = () => undefined;
    (fetchPolymarketEventsByIds as jest.Mock).mockReturnValueOnce(
      new Promise<PolymarketEvent[]>(resolve => {
        resolveEvents = resolve;
      })
    );

    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({
      placementsById: FIXTURE_V2_PLACEMENTS_BY_ID,
    });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    usePredictionEventsStore.setState({ enabled: true });
    const fetchPromise = usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });
    await flushMicrotasks();

    expect(usePredictionsSportsGroupsStore.getState()).toEqual({
      groups: [],
      isLoading: true,
    });

    resolveEvents(eventIds.map(eventId => createEvent(eventId)));
    await fetchPromise;
  });

  it('orders sports groups by enabled categories and drops disabled or unmatched category items', async () => {
    const sportsPlacement = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS_SPORTS];
    if (!sportsPlacement) throw new Error('Missing sports fixture');

    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    const placement: Placement = {
      ...sportsPlacement,
      categories: [
        { order: 1, category: 'sport_mlb', enabled: true },
        { order: 0, category: 'sport_nba', enabled: true },
        { order: 2, category: 'sport_nhl', enabled: false },
      ],
      items: [
        { order: 4, ref: { source: 'polymarket', type: 'prediction', category: 'sport_nba', id: 'nba-event-late' } },
        { order: 1, ref: { source: 'polymarket', type: 'prediction', category: 'sport_nhl', id: 'nhl-event' } },
        { order: 3, ref: { source: 'polymarket', type: 'prediction', category: 'sport_mlb', id: 'mlb-event' } },
        { order: 0, ref: { source: 'polymarket', type: 'prediction', category: 'sport_nba', id: 'nba-event-early' } },
        { order: 2, ref: { source: 'polymarket', type: 'prediction', category: 'sport_unknown', id: 'unknown-event' } },
      ],
    };

    const placementsById = await fetchPlacementsFromDocs([{ id: placement.id, data: () => placement }]);
    usePlacementsStore.setState({ placementsById });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    expect(usePredictionsSportsGroupsStore.getState().groups.map(group => group.category.category)).toEqual(['sport_nba', 'sport_mlb']);
    expect(usePredictionsSportsGroupsStore.getState().groups.map(group => group.items.map(item => item.ref.id))).toEqual([
      ['nba-event-early', 'nba-event-late'],
      ['mlb-event'],
    ]);
  });

  it('does not notify sports group subscribers for equivalent placement category and item shapes', async () => {
    const sportsPlacement = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.PREDICTIONS_SPORTS];
    if (!sportsPlacement) throw new Error('Missing sports fixture');

    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        polymarket_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    const watcher = jest.fn();
    const unsubscribe = usePredictionsSportsGroupsStore.subscribe(watcher);

    usePlacementsStore.setState({
      placementsById: {
        ...FIXTURE_V2_PLACEMENTS_BY_ID,
        [PLACEMENT_IDS.PREDICTIONS_SPORTS]: clonePlacement(sportsPlacement),
      },
    });
    await flushMicrotasks();

    expect(watcher).toHaveBeenCalledTimes(0);

    usePlacementsStore.setState({
      placementsById: {
        ...FIXTURE_V2_PLACEMENTS_BY_ID,
        [PLACEMENT_IDS.PREDICTIONS_SPORTS]: {
          ...clonePlacement(sportsPlacement),
          categories: sportsPlacement.categories?.map(category =>
            category.category === 'sport_nba' ? { ...category, order: category.order + 1 } : { ...category }
          ),
        },
      },
    });
    await flushMicrotasks();

    expect(watcher).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

function createEvent(
  id: string,
  markets?: Partial<PolymarketEvent['markets'][number]>[],
  overrides: Partial<PolymarketEvent> = {}
): PolymarketEvent {
  return {
    id,
    active: true,
    closed: false,
    ended: false,
    slug: id,
    ticker: id,
    title: `Event ${id}`,
    markets: (markets ?? [{ id, question: `Market ${id}`, slug: id, active: true, closed: false }]) as PolymarketEvent['markets'],
    ...overrides,
  } as PolymarketEvent;
}

function clonePlacement(placement: Placement): Placement {
  return JSON.parse(JSON.stringify(placement)) as Placement;
}

async function fetchPlacementsFromDocs(docs: { id: string; data: () => Placement }[]) {
  const { getDocs } = jest.requireMock('@react-native-firebase/firestore') as { getDocs: jest.Mock };
  getDocs.mockResolvedValueOnce({ docs });
  return fetchPlacements();
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}

function mockCreateStore<T extends object>(initialState: T) {
  const { subscribeWithSelector } = jest.requireActual<typeof import('zustand/middleware')>('zustand/middleware');
  const { createStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  return createStore(subscribeWithSelector(() => initialState));
}
