import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { RainbowError } from '@/logger';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';

export const usePolymarketEventIdStore = createRainbowStore<{ eventId: string | null }>(() => ({
  eventId: null,
}));

type FetchParams = { eventId: string | null };

export const usePolymarketEventStore = createQueryStore<PolymarketEvent, FetchParams>({
  fetcher: fetchPolymarketEvent,
  params: { eventId: $ => $(usePolymarketEventIdStore).eventId },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

export function prefetchPolymarketEvent(eventId: string) {
  usePolymarketEventIdStore.setState({ eventId });
  usePolymarketEventStore.getState().fetch({ eventId });
}

async function fetchPolymarketEvent({ eventId }: FetchParams, abortController: AbortController | null): Promise<PolymarketEvent> {
  if (!eventId) throw new RainbowError('[PolymarketEventStore] eventId is required');

  const url = `${POLYMARKET_GAMMA_API_URL}/events/${eventId}`;
  const { data } = await rainbowFetch(url, { abortController, timeout: 30000 });
  return data as PolymarketEvent;
}
