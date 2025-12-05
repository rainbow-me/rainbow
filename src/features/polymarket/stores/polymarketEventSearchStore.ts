import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';

const EMPTY_RESULT = Object.freeze({ events: [], hasMore: false });

type RawPolymarketEventSearchResponse = {
  events: RawPolymarketEvent[];
  hasMore: boolean;
};

type PolymarketEventSearchResult = {
  events: PolymarketEvent[];
  hasMore: boolean;
};

type PolymarketEventSearchParams = {
  searchQuery: string;
};

type PolymarketEventSearchStoreState = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getEvents: () => PolymarketEvent[];
};

export const usePolymarketEventSearchStore = createQueryStore<
  PolymarketEventSearchResult,
  PolymarketEventSearchParams,
  PolymarketEventSearchStoreState
>(
  {
    fetcher: fetchPolymarketEventSearch,
    staleTime: time.minutes(5),
    disableAutoRefetching: true,
    params: { searchQuery: ($, store) => $(store).searchQuery },
  },
  (set, get) => ({
    searchQuery: '',
    setSearchQuery: (searchQuery: string) => set({ searchQuery }),
    getEvents: () => get().getData()?.events ?? [],
  })
);

export const polymarketEventSearchActions = {
  setSearchQuery: (query: string) => usePolymarketEventSearchStore.getState().setSearchQuery(query),
};

async function fetchPolymarketEventSearch(
  { searchQuery }: PolymarketEventSearchParams,
  abortController: AbortController | null
): Promise<PolymarketEventSearchResult> {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return EMPTY_RESULT;

  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/public-search`);
  url.searchParams.set('q', trimmedQuery);
  url.searchParams.set('search_profiles', 'false');
  url.searchParams.set('events_status', 'active');
  url.searchParams.set('limit_per_type', '10');

  // This would be preferrable, but it is missing the volume field
  // url.searchParams.set('optimized', 'true');

  const { data: response } = await rainbowFetch<RawPolymarketEventSearchResponse>(url.toString(), {
    abortController,
    timeout: time.seconds(15),
  });

  return {
    ...response,
    events: await Promise.all(response.events.map(processRawPolymarketEvent)),
  };
}
