import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';

import { FIXTURE_V2_PLACEMENTS_BY_ID } from '../../__fixtures__/placements';
import { usePlacementsStore } from '../placementsStore';
import { getPredictionsPlacementStore, usePredictionEventsStore } from './predictionsPlacementStore';

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

const usePredictionsPlacementStore = getPredictionsPlacementStore('predictions');

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
    enablePolymarket();
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const expectedEventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds: expectedEventIds }, { force: true });

    const eventIds = (fetchPolymarketEventsByIds as jest.Mock).mock.calls[0]?.[0] as string[];
    expect(eventIds).toEqual([...new Set(eventIds)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
    expect(eventIds).toEqual(expect.arrayContaining(['27830', '32755']));
    expect(processRawPolymarketEvent).toHaveBeenCalled();
  });

  it('hydrates a requested predictions placement from fetched events', async () => {
    enablePolymarket();
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    const placement = usePredictionsPlacementStore.getState();
    expect(placement.placement?.id).toBe('predictions');
    expect(placement.items).toHaveLength(FIXTURE_V2_PLACEMENTS_BY_ID.predictions?.items.length);
  });

  it('filters closed events and events with only resolved markets out of placements', async () => {
    enablePolymarket();
    const predictions = FIXTURE_V2_PLACEMENTS_BY_ID.predictions;
    if (!predictions) throw new Error('Missing predictions fixture');
    const firstId = predictions.items[0]?.id;
    const secondId = predictions.items[1]?.id;

    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });
    (fetchPolymarketEventsByIds as jest.Mock).mockImplementation((eventIds: string[]) =>
      Promise.resolve(
        eventIds.map(eventId => {
          if (eventId === firstId) return createEvent(eventId, undefined, { closed: true });
          if (eventId === secondId) {
            return createEvent(eventId, [{ id: eventId, question: `Market ${eventId}`, slug: eventId, active: false, closed: true }]);
          }
          return createEvent(eventId);
        })
      )
    );

    const eventIds = usePlacementsStore.getState().getAllRefIds({ source: 'polymarket', type: 'prediction' });
    await usePredictionEventsStore.getState().fetch({ eventIds }, { force: true });

    expect(usePredictionsPlacementStore.getState().items.map(item => item.id)).not.toEqual(expect.arrayContaining([firstId, secondId]));
  });

  it('returns an empty placement result when the polymarket gate is off', () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    expect(usePredictionsPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });
});

function enablePolymarket(): void {
  useRemoteConfigStore.setState(state => ({
    config: {
      ...state.config,
      polymarket_enabled: true,
    },
  }));
}

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

function mockCreateStore<T extends object>(initialState: T) {
  const { subscribeWithSelector } = jest.requireActual<typeof import('zustand/middleware')>('zustand/middleware');
  const { createStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  return createStore(subscribeWithSelector(() => initialState));
}
