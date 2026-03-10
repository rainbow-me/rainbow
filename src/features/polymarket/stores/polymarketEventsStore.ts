import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type RawPolymarketEvent, type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { CATEGORIES, DEFAULT_CATEGORY_KEY, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { logger, RainbowError } from '@/logger';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { usePolymarketCategoryStore } from './usePolymarketCategoryStore';

const PAGE_SIZE = 26;
const EMPTY_EVENTS: PolymarketEvent[] = [];

type PolymarketEventsParams = {
  categoryKey: string;
  offset: number;
};

type PolymarketEventsPage = {
  events: PolymarketEvent[];
  hasMore: boolean;
  nextOffset: number;
};

type CategoryEvents = {
  events: PolymarketEvent[];
  hasMore: boolean;
  isFetchingNextPage: boolean;
  nextOffset: number;
};

type PolymarketEventsStoreState = {
  eventsByCategory: Record<string, CategoryEvents>;
  fetchNextPage: () => Promise<void>;
  getEvents: () => PolymarketEvent[];
  hasNextPage: () => boolean;
  isFetchingNextPage: () => boolean;
};

export const usePolymarketEventsStore = createQueryStore<PolymarketEventsPage, PolymarketEventsParams, PolymarketEventsStoreState>(
  {
    fetcher: fetchPolymarketEventsPage,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(20),
    enabled: $ => $(usePolymarketCategoryStore, state => state.tagId !== CATEGORIES.sports.tagId),
    params: {
      categoryKey: $ => $(usePolymarketCategoryStore).tagId,
      offset: 0,
    },
    onFetched: ({ data, params, set }) => {
      if (params.offset !== 0) return;

      set(state => ({
        eventsByCategory: {
          ...state.eventsByCategory,
          [params.categoryKey]: {
            events: data.events,
            hasMore: data.hasMore,
            isFetchingNextPage: false,
            nextOffset: data.nextOffset,
          },
        },
      }));
    },
  },
  (set, get) => {
    const fetchPromisesByCategory = new Map<string, Promise<void>>();

    function getInitialCategoryEvents(categoryKey: string): CategoryEvents | null {
      const firstPage = get().getData({ categoryKey, offset: 0 });
      if (!firstPage) return null;

      return {
        events: firstPage.events,
        hasMore: firstPage.hasMore,
        isFetchingNextPage: false,
        nextOffset: firstPage.nextOffset,
      };
    }

    function setCategoryFetchingState(categoryKey: string, isFetchingNextPage: boolean) {
      set(state => {
        const categoryEvents = state.eventsByCategory[categoryKey];
        if (!categoryEvents || categoryEvents.isFetchingNextPage === isFetchingNextPage) return state;

        return {
          eventsByCategory: {
            ...state.eventsByCategory,
            [categoryKey]: {
              ...categoryEvents,
              isFetchingNextPage,
            },
          },
        };
      });
    }

    return {
      eventsByCategory: {},

      async fetchNextPage() {
        const categoryKey = usePolymarketCategoryStore.getState().tagId;
        if (categoryKey === CATEGORIES.sports.tagId) return;

        const { fetch, eventsByCategory } = get();

        const currentCategoryEvents = eventsByCategory[categoryKey] ?? getInitialCategoryEvents(categoryKey);

        if (!currentCategoryEvents?.hasMore || currentCategoryEvents.isFetchingNextPage) return;
        if (!currentCategoryEvents.events.length) return;

        if (!eventsByCategory[categoryKey] && currentCategoryEvents) {
          set(state => ({
            eventsByCategory: {
              ...state.eventsByCategory,
              [categoryKey]: currentCategoryEvents,
            },
          }));
        }

        const existingFetchPromise = fetchPromisesByCategory.get(categoryKey);
        if (existingFetchPromise) return existingFetchPromise;

        const nextOffset = currentCategoryEvents.nextOffset;
        setCategoryFetchingState(categoryKey, true);

        const fetchPromise = fetch(
          { categoryKey, offset: nextOffset },
          {
            force: true,
            skipStoreUpdates: true,
          }
        )
          .then(data => {
            if (!data) return;

            const latestState = get();
            const latestCategoryEvents = latestState.eventsByCategory[categoryKey] ?? getInitialCategoryEvents(categoryKey);
            if (!latestCategoryEvents) return;

            set({
              eventsByCategory: {
                ...latestState.eventsByCategory,
                [categoryKey]: {
                  events: mergeEventsById(latestCategoryEvents.events, data.events),
                  hasMore: data.hasMore,
                  isFetchingNextPage: false,
                  nextOffset: data.nextOffset,
                },
              },
            });
          })
          .catch(error => {
            logger.error(new RainbowError('[polymarketEventsStore]: Failed to fetch next page', error));
          })
          .finally(() => {
            setCategoryFetchingState(categoryKey, false);
            fetchPromisesByCategory.delete(categoryKey);
          });

        fetchPromisesByCategory.set(categoryKey, fetchPromise);
        return fetchPromise;
      },

      getEvents: () => {
        const categoryKey = usePolymarketCategoryStore.getState().tagId;
        return get().eventsByCategory[categoryKey]?.events ?? get().getData({ categoryKey, offset: 0 })?.events ?? EMPTY_EVENTS;
      },

      hasNextPage: () => {
        const categoryKey = usePolymarketCategoryStore.getState().tagId;
        return get().eventsByCategory[categoryKey]?.hasMore ?? get().getData({ categoryKey, offset: 0 })?.hasMore ?? false;
      },

      isFetchingNextPage: () => {
        const categoryKey = usePolymarketCategoryStore.getState().tagId;
        return get().eventsByCategory[categoryKey]?.isFetchingNextPage ?? false;
      },
    };
  },
  { storageKey: 'polymarketEventsStore', version: 1 }
);

export const polymarketEventsActions = createStoreActions(usePolymarketEventsStore);

export function prefetchPolymarketEvents() {
  usePolymarketEventsStore.getState().fetch();
}

async function fetchPolymarketEventsPage(
  { categoryKey, offset }: PolymarketEventsParams,
  abortController: AbortController | null
): Promise<PolymarketEventsPage> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('order', 'volume24hr');
  url.searchParams.set('ascending', 'false');
  if (offset > 0) {
    url.searchParams.set('offset', String(offset));
  }

  if (categoryKey !== DEFAULT_CATEGORY_KEY) {
    url.searchParams.set('tag_slug', categoryKey);
  }

  const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const filteredEvents = events.filter(event => event.ended !== true);
  const processedEvents = await Promise.all(filteredEvents.map(event => processRawPolymarketEvent(event)));

  return {
    events: processedEvents,
    hasMore: events.length === PAGE_SIZE,
    nextOffset: offset + events.length,
  };
}

function mergeEventsById(existingEvents: PolymarketEvent[], nextEvents: PolymarketEvent[]): PolymarketEvent[] {
  const existingIds = new Set(existingEvents.map(event => event.id));
  const uniqueNextEvents = nextEvents.filter(event => !existingIds.has(event.id));
  return existingEvents.concat(uniqueNextEvents);
}
