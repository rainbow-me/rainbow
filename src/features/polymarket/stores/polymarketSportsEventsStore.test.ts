import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { fetchPolymarketSportsEvents } from './polymarketSportsEventsStore';

jest.mock('@/config/experimental', () => ({
  POLYMARKET: 'polymarket',
}));

jest.mock('@/config/experimentalConfigStore', () => ({
  useExperimentalConfigStore: mockStore({
    getFlag: jest.fn(() => false),
  }),
}));

jest.mock('@/features/polymarket/constants', () => ({
  DEFAULT_SPORTS_LEAGUE_KEY: 'all',
  POLYMARKET_GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  POLYMARKET_SPORTS_MARKET_TYPE: {
    MONEYLINE: 'moneyline',
  },
}));

jest.mock('@/features/polymarket/stores/polymarketTeamMetadataStore', () => ({
  fetchPolymarketTeamMetadataForGameEvents: jest.fn(),
}));

jest.mock('@/features/polymarket/utils/transforms', () => ({
  processRawPolymarketEvent: jest.fn(),
}));

jest.mock('@/framework/data/http/rainbowFetch', () => ({
  rainbowFetch: jest.fn(),
}));

jest.mock('@/model/remoteConfig', () => ({
  useRemoteConfigStore: mockStore({
    getRemoteConfigKey: jest.fn(() => false),
  }),
}));

function mockStore<T>(state: T) {
  return Object.assign(jest.fn(), {
    getState: jest.fn(() => state),
    subscribe: jest.fn(() => jest.fn()),
  });
}

const mockFetchPolymarketTeamMetadataForGameEvents = fetchPolymarketTeamMetadataForGameEvents as jest.MockedFunction<
  typeof fetchPolymarketTeamMetadataForGameEvents
>;
const mockProcessRawPolymarketEvent = processRawPolymarketEvent as jest.MockedFunction<typeof processRawPolymarketEvent>;
const mockRainbowFetch = rainbowFetch as jest.MockedFunction<typeof rainbowFetch>;

type EventOptions = {
  id: string;
  endDate?: string;
  ended?: boolean;
  gameId?: number | null;
  startTime?: string | null;
  sportsMarketType?: string;
  umaResolutionStatus?: string;
};

function makeEvent({
  id,
  endDate,
  ended = false,
  gameId = 1,
  startTime,
  sportsMarketType = 'moneyline',
  umaResolutionStatus,
}: EventOptions): RawPolymarketEvent {
  const eventStartTime = startTime === undefined ? '2026-06-15T20:00:00Z' : startTime;
  const eventEndDate = endDate ?? eventStartTime ?? '2026-06-15T20:00:00Z';

  return {
    id,
    ended,
    endDate: eventEndDate,
    gameId,
    markets: [
      {
        active: true,
        closed: false,
        clobTokenIds: JSON.stringify(['token-a', 'token-b']),
        sportsMarketType,
        umaResolutionStatus,
      },
    ],
    startTime: eventStartTime ?? undefined,
    ticker: id,
  } as RawPolymarketEvent;
}

describe('fetchPolymarketSportsEvents', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    mockRainbowFetch.mockResolvedValue({
      data: [],
      headers: new Headers(),
      status: 200,
    });
    mockFetchPolymarketTeamMetadataForGameEvents.mockResolvedValue(new Map());
    mockProcessRawPolymarketEvent.mockImplementation(async event => ({ id: event.id }) as PolymarketEvent);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('keeps the primary game event and drops companion, derivative, and resolved events', async () => {
    const primaryGameEvent = makeEvent({ id: 'primary-game-event' });
    const moreMarketsCompanion = makeEvent({ id: 'more-markets-companion', gameId: null, sportsMarketType: 'spreads' });
    const halftimeDerivative = makeEvent({ id: 'halftime-derivative', sportsMarketType: 'soccer_halftime_result' });
    const resolvedGameEvent = makeEvent({ id: 'resolved-game-event', umaResolutionStatus: 'resolved' });

    mockRainbowFetch.mockResolvedValueOnce({
      data: [moreMarketsCompanion, primaryGameEvent, halftimeDerivative, resolvedGameEvent],
      headers: new Headers(),
      status: 200,
    });

    const events = await fetchPolymarketSportsEvents(undefined as never, null);

    expect(mockFetchPolymarketTeamMetadataForGameEvents).toHaveBeenCalledWith([primaryGameEvent], null);
    expect(mockProcessRawPolymarketEvent).toHaveBeenCalledTimes(1);
    expect(events).toEqual([{ id: 'primary-game-event' }]);
  });

  it('keeps same-day finals and drops finals from previous days', async () => {
    const sameDayFinal = makeEvent({ id: 'same-day-final', ended: true, startTime: '2026-06-15T10:00:00Z' });
    const oldFinal = makeEvent({ id: 'old-final', ended: true, startTime: '2026-06-14T10:00:00Z' });

    mockRainbowFetch.mockResolvedValueOnce({
      data: [oldFinal, sameDayFinal],
      headers: new Headers(),
      status: 200,
    });

    const events = await fetchPolymarketSportsEvents(undefined as never, null);

    expect(mockFetchPolymarketTeamMetadataForGameEvents).toHaveBeenCalledWith([sameDayFinal], null);
    expect(mockProcessRawPolymarketEvent).toHaveBeenCalledTimes(1);
    expect(events).toEqual([{ id: 'same-day-final' }]);
  });

  it('keeps same-day finals when Gamma omits startTime but sends endDate', async () => {
    const sameDayFinalWithoutStartTime = makeEvent({
      id: 'same-day-final-without-start-time',
      ended: true,
      startTime: null,
      endDate: '2026-06-15T10:00:00Z',
    });
    const oldFinalWithoutStartTime = makeEvent({
      id: 'old-final-without-start-time',
      ended: true,
      startTime: null,
      endDate: '2026-06-14T10:00:00Z',
    });

    mockRainbowFetch.mockResolvedValueOnce({
      data: [oldFinalWithoutStartTime, sameDayFinalWithoutStartTime],
      headers: new Headers(),
      status: 200,
    });

    const events = await fetchPolymarketSportsEvents(undefined as never, null);

    expect(mockFetchPolymarketTeamMetadataForGameEvents).toHaveBeenCalledWith([sameDayFinalWithoutStartTime], null);
    expect(events).toEqual([{ id: 'same-day-final-without-start-time' }]);
  });
});
