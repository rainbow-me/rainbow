import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

const PAGE_SIZE = 10;
const EMPTY_RESULT = Object.freeze({ events: [], pagination: { hasMore: false, totalResults: 0 } });

type RawPolymarketEventSearchResponse = {
  events: RawPolymarketEvent[];
  pagination: {
    hasMore: boolean;
    totalResults: number;
  };
};

type PolymarketEventSearchResult = {
  events: PolymarketEvent[];
  pagination: {
    hasMore: boolean;
    totalResults: number;
  };
};

type PolymarketEventSearchParams = {
  searchQuery: string;
  page: number;
};

type AccumulatedSearchResults = {
  events: PolymarketEvent[];
  pagination: {
    hasMore: boolean;
    totalResults: number;
    currentPage: number;
  };
};

type PolymarketEventSearchStoreState = {
  searchQuery: string;
  searchResults: AccumulatedSearchResults | null;
  setSearchQuery: (query: string) => void;
  fetchNextPage: () => Promise<void>;
  getEvents: () => PolymarketEvent[];
  hasNextPage: () => boolean;
};

let paginationPromise: { searchQuery: string; promise: Promise<void> } | null = null;

export const usePolymarketEventSearchStore = createQueryStore<
  PolymarketEventSearchResult,
  PolymarketEventSearchParams,
  PolymarketEventSearchStoreState
>(
  {
    fetcher: fetchPolymarketEventSearch,
    staleTime: time.minutes(5),
    disableAutoRefetching: true,
    params: {
      searchQuery: ($, store) => $(store).searchQuery,
      page: 1,
    },
    onFetched: ({ data, params, set }) => {
      if (params.page === 1) {
        set({
          searchResults: {
            events: data.events,
            pagination: {
              hasMore: data.pagination.hasMore,
              totalResults: data.pagination.totalResults,
              currentPage: 1,
            },
          },
        });
      }
    },
  },
  (set, get) => ({
    searchQuery: '',
    searchResults: null,

    setSearchQuery: (searchQuery: string) => {
      const currentQuery = get().searchQuery;
      if (currentQuery !== searchQuery) {
        set({ searchQuery, searchResults: null });
      }
    },

    async fetchNextPage() {
      const { searchQuery, searchResults, fetch } = get();
      const trimmedQuery = searchQuery.trim();

      if (!trimmedQuery) return;

      if (paginationPromise && paginationPromise.searchQuery === trimmedQuery) {
        return paginationPromise.promise;
      }

      const paginationInfo = searchResults?.pagination;

      if (!paginationInfo) return;

      const currentEvents = searchResults.events;
      const nextPage = paginationInfo.currentPage + 1;

      paginationPromise = {
        searchQuery: trimmedQuery,
        promise: fetch({ page: nextPage }, { force: true, skipStoreUpdates: true })
          .then(data => {
            if (!data) return;
            set({
              searchResults: {
                events: [...currentEvents, ...data.events],
                pagination: {
                  hasMore: data.pagination.hasMore,
                  totalResults: data.pagination.totalResults,
                  currentPage: nextPage,
                },
              },
            });
          })
          .finally(() => (paginationPromise = null)),
      };

      return paginationPromise.promise;
    },

    getEvents: () => get().searchResults?.events ?? [],

    hasNextPage: () => get().searchResults?.pagination?.hasMore ?? false,
  })
);

export const polymarketEventSearchActions = createStoreActions(usePolymarketEventSearchStore);

async function fetchPolymarketEventSearch(
  { searchQuery, page }: PolymarketEventSearchParams,
  abortController: AbortController | null
): Promise<PolymarketEventSearchResult> {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return EMPTY_RESULT;

  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/public-search`);
  url.searchParams.set('q', trimmedQuery);
  url.searchParams.set('search_profiles', 'false');
  url.searchParams.set('events_status', 'active');
  url.searchParams.set('limit_per_type', String(PAGE_SIZE));
  if (page > 1) {
    url.searchParams.set('page', String(page));
  }

  const { data: response } = await rainbowFetch<RawPolymarketEventSearchResponse>(url.toString(), {
    abortController,
    timeout: time.seconds(15),
  });

  return {
    ...response,
    events: await Promise.all(response.events.map(event => processRawPolymarketEvent(event))),
  };
}
