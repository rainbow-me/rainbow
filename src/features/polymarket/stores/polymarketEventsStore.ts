import { CATEGORIES, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { PolymarketEvent, RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { fetchPersonalizedPolymarketEvents } from '@/features/polymarket/utils/personalizedFeed';
import { rainbowFetch } from '@/rainbow-fetch';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { POLYMARKET_RECOMMENDATIONS_ADAPTER } from '@/systems/recommendations/adapters/polymarketRecommendations';
import { rankByTrending } from '@/systems/recommendations/ranking';
import { time } from '@/utils/time';
import { usePolymarketRecommendationsStore } from './polymarketRecommendationsStore';

// ============ Types ========================================================== //

type PolymarketEventsParams = {
  categoryKey: string;
};

type PolymarketEventsStoreState = {
  categoryKey: string;
  setCategoryKey: (categoryKey: string) => void;
};

// ============ Constants ====================================================== //

const EVENTS_LIMIT = 36;
const TRENDING_POOL_MULTIPLIER = 3;
const EMPTY_EVENTS: PolymarketEvent[] = [];

// ============ Store ========================================================== //

export const usePolymarketEventsStore = createQueryStore<PolymarketEvent[], PolymarketEventsParams, PolymarketEventsStoreState>(
  {
    fetcher: fetchEvents,
    enabled: ($, store) => $(store, state => state.categoryKey !== CATEGORIES.sports.tagId),
    params: { categoryKey: ($, store) => $(store).categoryKey },
    cacheTime: time.minutes(20),
    staleTime: time.minutes(2),
  },

  set => ({
    categoryKey: 'trending',

    setCategoryKey: categoryKey =>
      set(state => {
        if (categoryKey === state.categoryKey) return state;
        return { categoryKey };
      }),
  }),

  { storageKey: 'polymarketEventsStore' }
);

export function prefetchPolymarketEvents(): void {
  usePolymarketEventsStore.getState().fetch();
}

// ============ Fetcher ======================================================== //

async function fetchEvents({ categoryKey }: PolymarketEventsParams, abortController: AbortController | null): Promise<PolymarketEvent[]> {
  if (categoryKey === 'forYou') {
    return fetchForYouEvents({ abortController });
  }

  if (categoryKey === 'trending') {
    return fetchTrendingEvents({ abortController });
  }

  return fetchCategoryEvents({ abortController, categoryKey });
}

// ============ For You Events ================================================= //

async function fetchForYouEvents({ abortController }: { abortController: AbortController | null }): Promise<PolymarketEvent[]> {
  const profile = usePolymarketRecommendationsStore.getState().recommendationProfile;
  return fetchPersonalizedPolymarketEvents({ abortController, limit: EVENTS_LIMIT, profile });
}

// ============ Trending Events ================================================ //

async function fetchTrendingEvents({ abortController }: { abortController: AbortController | null }): Promise<PolymarketEvent[]> {
  const candidatePool = await fetchEventPool({
    abortController,
    limit: EVENTS_LIMIT * TRENDING_POOL_MULTIPLIER,
  });

  if (candidatePool.length === 0) return EMPTY_EVENTS;

  const ranked = rankByTrending({
    adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
    items: candidatePool,
    limit: EVENTS_LIMIT,
  });

  return ranked.map(item => item.item);
}

// ============ Category Events ================================================ //

async function fetchCategoryEvents({
  abortController,
  categoryKey,
}: {
  abortController: AbortController | null;
  categoryKey: string;
}): Promise<PolymarketEvent[]> {
  const tagSlug = getTagSlugForCategoryKey(categoryKey);
  return fetchEventPool({ abortController, limit: EVENTS_LIMIT, tagSlug });
}

// ============ Event Pool Fetching ============================================ //

async function fetchEventPool({
  abortController,
  limit,
  tagSlug = null,
}: {
  abortController: AbortController | null;
  limit: number;
  tagSlug?: string | null;
}): Promise<PolymarketEvent[]> {
  const url = buildEventsApiUrl({ limit, tagSlug });

  const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const activeEvents = events.filter(event => event.ended !== true);
  if (activeEvents.length === 0) return EMPTY_EVENTS;

  return Promise.all(activeEvents.map(event => processRawPolymarketEvent(event)));
}

function buildEventsApiUrl({ limit, tagSlug }: { limit: number; tagSlug: string | null }): URL {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('ascending', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('order', 'volume24hr');

  if (tagSlug) {
    url.searchParams.set('tag_slug', tagSlug);
  }

  return url;
}

// ============ Utilities ====================================================== //

function isCategoryKey(key: string): key is keyof typeof CATEGORIES {
  return key in CATEGORIES;
}

function getTagSlugForCategoryKey(key: string): string | null {
  if (!isCategoryKey(key)) return null;
  return CATEGORIES[key].tagId;
}
