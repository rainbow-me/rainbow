import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

const PAGE_SIZE = 25;

type PolymarketEventsByTagStore = ReturnType<typeof createPolymarketEventsByTagStore>;

const storesByTagSlug = new Map<string, PolymarketEventsByTagStore>();

export function getPolymarketEventsByTagStore(tagSlug: string): PolymarketEventsByTagStore {
  let store = storesByTagSlug.get(tagSlug);
  if (!store) {
    store = createPolymarketEventsByTagStore(tagSlug);
    storesByTagSlug.set(tagSlug, store);
  }
  return store;
}

function createPolymarketEventsByTagStore(tagSlug: string) {
  return createQueryStore<PolymarketEvent[]>(
    {
      fetcher: (_params, abortController) => fetchTopPolymarketEventsByTag(tagSlug, abortController),
      staleTime: time.minutes(2),
      cacheTime: time.minutes(20),
    },
    { storageKey: `polymarketEventsByTag:${tagSlug}`, version: 1 }
  );
}

async function fetchTopPolymarketEventsByTag(tagSlug: string, abortController: AbortController | null): Promise<PolymarketEvent[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('order', 'volume24hr');
  url.searchParams.set('ascending', 'false');
  url.searchParams.set('tag_slug', tagSlug);

  const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const filteredEvents = events.filter(event => event.ended !== true);
  return Promise.all(filteredEvents.map(event => processRawPolymarketEvent(event)));
}
