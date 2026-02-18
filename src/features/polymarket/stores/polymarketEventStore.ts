import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { RainbowError } from '@/logger';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { fetchTeamsForEvent } from '@/features/polymarket/utils/sports';

type FetchParams = { eventId: string | null };

type PolymarketEventStoreState = {
  eventId: string | null;
  getMarkets: (sortOrder?: MarketSortOrder) => PolymarketMarket[] | undefined;
};

export const MarketSortOrder = {
  VOLUME: 'volume',
  PRICE: 'price',
  VOLUME_24HR: 'volume24hr',
  END_DATE: 'endDate',
  DEFAULT: 'default',
} as const;

type MarketSortOrder = (typeof MarketSortOrder)[keyof typeof MarketSortOrder];

export const usePolymarketEventStore = createQueryStore<PolymarketEvent, FetchParams, PolymarketEventStoreState>(
  {
    fetcher: fetchPolymarketEvent,
    params: { eventId: ($, store) => $(store).eventId },
    staleTime: time.minutes(2),
    cacheTime: time.minutes(10),
  },
  (_, get) => ({
    eventId: null,
    getMarkets: sortOrder => {
      const event = get().getData();
      const markets = event?.markets;
      const sortBy = sortOrder ?? event?.sortBy ?? MarketSortOrder.DEFAULT;
      if (!markets) return undefined;
      return sortMarkets(markets, sortBy);
    },
  })
);

function sortMarkets(markets: PolymarketMarket[], sortOrder: MarketSortOrder) {
  return markets.sort((a, b) => {
    switch (sortOrder) {
      case MarketSortOrder.VOLUME:
        return Number(b.volume) - Number(a.volume);
      case MarketSortOrder.PRICE:
        return Number(b.lastTradePrice) - Number(a.lastTradePrice);
      case MarketSortOrder.VOLUME_24HR:
        return Number(b.volume24hr) - Number(a.volume24hr);
      case MarketSortOrder.END_DATE:
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      case MarketSortOrder.DEFAULT:
        return Number(a.groupItemThreshold) - Number(b.groupItemThreshold);
    }
  });
}

export function prefetchPolymarketEvent(eventId: string) {
  usePolymarketEventStore.setState({ eventId });
}

async function fetchPolymarketEvent({ eventId }: FetchParams, abortController: AbortController | null): Promise<PolymarketEvent> {
  if (!eventId) throw new RainbowError('[PolymarketEventStore] eventId is required');

  const url = `${POLYMARKET_GAMMA_API_URL}/events/${eventId}`;
  const { data: event } = await rainbowFetch<RawPolymarketEvent>(url, { abortController, timeout: time.seconds(15) });

  let teams: PolymarketTeamInfo[] | undefined = undefined;

  if (event.gameId) {
    teams = await fetchTeamsForEvent(event);
  }

  const processedEvent = await processRawPolymarketEvent(event, teams);
  const sortBy = processedEvent?.sortBy ?? MarketSortOrder.DEFAULT;

  return {
    ...processedEvent,
    markets: sortMarkets(
      processedEvent.markets.filter(market => market.active),
      sortBy
    ),
  };
}
