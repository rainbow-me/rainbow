import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';

type PolymarketEventsParams = {
  tagId: string | null;
};

type PolymarketEventsStoreState = {
  tagId: string | null;
  setTagId: (tagId: string | null) => void;
};

export const usePolymarketEventsStore = createQueryStore<PolymarketEvent[], PolymarketEventsParams, PolymarketEventsStoreState>(
  {
    fetcher: fetchPolymarketEvents,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(10),
    params: { tagId: ($, store) => $(store).tagId },
  },
  set => ({
    tagId: null,
    setTagId: (tagId: string | null) => set({ tagId }),
  })
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

  if (tagId) {
    url.searchParams.set('tag_slug', tagId);
  }

  const { data } = await rainbowFetch(url.toString(), { abortController, timeout: 30000 });
  const events = data as RawPolymarketEvent[];

  const filteredEvents = events.filter(event => event.ended !== true);

  return await Promise.all(filteredEvents.map(event => processRawPolymarketEvent(event)));
}
