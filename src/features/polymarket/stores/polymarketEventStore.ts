import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { RainbowError } from '@/logger';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { PolymarketGameMetadata, PolymarketTeamInfo } from '@/features/polymarket/types';

type FetchParams = { eventId: string | null };

type PolymarketEventStoreState = {
  eventId: string | null;
  getMarkets: (sortOrder?: MarketSortOrder) => PolymarketMarket[] | undefined;
};

export const MarketSortOrder = {
  VOLUME: 'volume',
  LAST_TRADE_PRICE: 'lastTradePrice',
  VOLUME_24HR: 'volume24hr',
  END_DATE: 'endDate',
} as const;

type MarketSortOrder = (typeof MarketSortOrder)[keyof typeof MarketSortOrder];

export const usePolymarketEventStore = createQueryStore<PolymarketEvent, FetchParams, PolymarketEventStoreState>(
  {
    fetcher: fetchPolymarketEvent,
    params: { eventId: ($, store) => $(store).eventId },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(10),
  },
  (_, get) => ({
    eventId: null,
    getMarkets: (sortOrder: MarketSortOrder = MarketSortOrder.LAST_TRADE_PRICE) => {
      const markets = get().getData()?.markets;
      if (!markets) return undefined;
      return sortMarkets(markets, sortOrder);
    },
  })
);

function filterMarkets(markets: PolymarketMarket[]) {
  return markets.filter(market => market.active);
}

function sortMarkets(markets: PolymarketMarket[], sortOrder: MarketSortOrder) {
  return markets.sort((a, b) => {
    switch (sortOrder) {
      case MarketSortOrder.VOLUME:
        return Number(b.volume) - Number(a.volume);
      case MarketSortOrder.LAST_TRADE_PRICE:
        return Number(b.lastTradePrice) - Number(a.lastTradePrice);
      case MarketSortOrder.VOLUME_24HR:
        return Number(b.volume24hr) - Number(a.volume24hr);
      case MarketSortOrder.END_DATE:
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    }
  });
}

export function prefetchPolymarketEvent(eventId: string) {
  usePolymarketEventStore.setState({ eventId });
}

async function fetchPolymarketEvent({ eventId }: FetchParams, abortController: AbortController | null): Promise<PolymarketEvent> {
  if (!eventId) throw new RainbowError('[PolymarketEventStore] eventId is required');

  const url = `${POLYMARKET_GAMMA_API_URL}/events/${eventId}`;
  const { data: event } = await rainbowFetch<RawPolymarketEvent>(url, { abortController, timeout: 30000 });

  if (event.gameId && (!event.homeTeamName || !event.awayTeamName)) {
    const gameMetadata = await fetchGameMetadata(event.slug);
    if (gameMetadata.ordering === 'home') {
      event.homeTeamName = gameMetadata.teams[0];
      event.awayTeamName = gameMetadata.teams[1];
    } else {
      event.homeTeamName = gameMetadata.teams[1];
      event.awayTeamName = gameMetadata.teams[0];
    }
  }

  let teams: PolymarketTeamInfo[] = [];

  if (event.homeTeamName && event.awayTeamName) {
    teams = await fetchTeamsInfo([event.homeTeamName, event.awayTeamName]);
  }

  const processedEvent = await processRawPolymarketEvent(event, teams);

  return {
    ...processedEvent,
    markets: filterMarkets(processedEvent.markets),
  };
}

async function fetchGameMetadata(eventSlug: string) {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/games`);
  url.searchParams.set('ticker', eventSlug);
  const { data } = await rainbowFetch<PolymarketGameMetadata>(url.toString(), { timeout: time.seconds(15) });
  return data;
}

async function fetchTeamsInfo(teamNames: string[]) {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/teams`);
  teamNames.forEach(name => {
    url.searchParams.append('name', name);
  });
  const { data } = await rainbowFetch<PolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
  return data;
}
