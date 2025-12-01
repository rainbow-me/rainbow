import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';

export const MarketSortOrder = {
  VOLUME: 'volume',
  LAST_TRADE_PRICE: 'lastTradePrice',
  VOLUME_24HR: 'volume24hr',
  END_DATE: 'endDate',
} as const;

type MarketSortOrder = (typeof MarketSortOrder)[keyof typeof MarketSortOrder];

export const usePolymarketEventsStore = createQueryStore<PolymarketEvent[]>({
  fetcher: fetchPolymarketEvents,
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

export function prefetchPolymarketEvents() {
  usePolymarketEventsStore.getState().fetch();
}

async function fetchPolymarketEvents(_: Record<string, never>, abortController: AbortController | null): Promise<PolymarketEvent[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('limit', '50');
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('order', 'volume24hr');
  url.searchParams.set('ascending', 'false');
  // TESTING:
  url.searchParams.set('tag_slug', 'sports');

  const { data } = await rainbowFetch(url.toString(), { abortController, timeout: 30000 });
  const events = data as RawPolymarketEvent[];

  return await Promise.all(events.map(processRawPolymarketEvent));
}
