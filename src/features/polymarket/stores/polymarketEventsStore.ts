import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { CATEGORIES, DEFAULT_CATEGORY_KEY, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { usePolymarketCategoryStore } from './usePolymarketCategoryStore';

type PolymarketEventsParams = {
  tagId: string;
};

export const usePolymarketEventsStore = createQueryStore<PolymarketEvent[], PolymarketEventsParams>(
  {
    fetcher: fetchPolymarketEvents,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(20),
    enabled: $ => $(usePolymarketCategoryStore, state => state.tagId !== CATEGORIES.sports.tagId),
    params: { tagId: $ => $(usePolymarketCategoryStore).tagId },
  },
  { storageKey: 'polymarketEventsStore' }
);

export function prefetchPolymarketEvents() {
  usePolymarketEventsStore.getState().fetch();
}

async function fetchPolymarketEvents(
  { tagId }: PolymarketEventsParams,
  abortController: AbortController | null
): Promise<PolymarketEvent[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('limit', '26');
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('order', 'volume24hr');
  url.searchParams.set('ascending', 'false');

  if (tagId && tagId !== DEFAULT_CATEGORY_KEY) {
    url.searchParams.set('tag_slug', tagId);
  }

  const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const filteredEvents = events.filter(event => event.ended !== true);

  return await Promise.all(filteredEvents.map(event => processRawPolymarketEvent(event)));
}
