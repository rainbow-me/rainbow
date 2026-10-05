import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';

import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { fetchPolymarketSportsEvents } from './polymarketSportsEventsStore';

vi.mock('@/features/config/constants/experimental', () => ({
  POLYMARKET: 'polymarket',
}));

vi.mock('@/features/config/stores/experimentalConfigStore', () => ({
  useExperimentalConfigStore: mockStore({
    getFlag: vi.fn(() => false),
  }),
}));

vi.mock('@/features/polymarket/constants', () => ({
  DEFAULT_SPORTS_LEAGUE_KEY: 'all',
  POLYMARKET_GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  POLYMARKET_SPORTS_MARKET_TYPE: {
    MONEYLINE: 'moneyline',
  },
}));

vi.mock('@/features/polymarket/stores/polymarketTeamMetadataStore', () => ({
  fetchPolymarketTeamMetadataForGameEvents: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/transforms', () => ({
  processRawPolymarketEvent: vi.fn(),
}));

vi.mock('@/framework/data/http/rainbowFetch', () => ({
  rainbowFetch: vi.fn(),
}));

vi.mock('@/features/config/stores/remoteConfig');

function mockStore<T>(state: T) {
  return Object.assign(vi.fn(), {
    getState: vi.fn(() => state),
    subscribe: vi.fn(() => vi.fn()),
  });
}

const mockFetchPolymarketTeamMetadataForGameEvents = fetchPolymarketTeamMetadataForGameEvents as MockedFunction<
  typeof fetchPolymarketTeamMetadataForGameEvents
>;
const mockProcessRawPolymarketEvent = processRawPolymarketEvent as MockedFunction<typeof processRawPolymarketEvent>;
const mockRainbowFetch = rainbowFetch as MockedFunction<typeof rainbowFetch>;

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    mockRainbowFetch.mockResolvedValue({
      data: [],
      headers: new Headers(),
      status: 200,
    });
    mockFetchPolymarketTeamMetadataForGameEvents.mockResolvedValue(new Map());
    mockProcessRawPolymarketEvent.mockImplementation(async event => ({ id: event.id }) as PolymarketEvent);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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
