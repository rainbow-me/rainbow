import { PolymarketEvent, RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/rainbow-fetch';
import { DEFAULT_RECOMMENDATION_TUNING } from '@/systems/recommendations/defaults';
import { POLYMARKET_RECOMMENDATIONS_ADAPTER } from '@/systems/recommendations/adapters/polymarketRecommendations';
import { rankRecommendationItems } from '@/systems/recommendations/ranking';
import { RecommendationProfile } from '@/systems/recommendations/types';
import { getTopAffinitiesWithScores } from '@/systems/recommendations/utils';
import { time } from '@/utils/time';
import { POLYMARKET_GAMMA_API_URL } from '../constants';

// ============ Constants ====================================================== //

const EMPTY_EVENTS: PolymarketEvent[] = [];

/**
 * Limits for the personalized event fetch strategy.
 *
 * The fetch planner builds a candidate pool by combining trending events with
 * events from the user's preferred tags. The pool is then ranked and trimmed
 * to the requested limit.
 */
type FetchLimits = {
  /** Number of candidates to fetch for each result requested. */
  candidatesPerResult: number;

  /** Maximum number of preferred tags to query. */
  maxTags: number;

  /** Tags allocated fewer events than this are excluded. */
  tagFetchThreshold: number;
};

const FETCH_LIMITS: FetchLimits = {
  candidatesPerResult: 3,
  maxTags: 10,
  tagFetchThreshold: 2,
};

// ============ Public API ===================================================== //

export async function fetchPersonalizedPolymarketEvents({
  abortController,
  limit,
  profile,
}: {
  abortController: AbortController | null;
  limit: number;
  profile: RecommendationProfile;
}): Promise<PolymarketEvent[]> {
  const plan = computeFetchPlan({ limit, profile });
  const candidatePool = await fetchCandidatePool({ abortController, plan });

  if (!candidatePool.length) return EMPTY_EVENTS;

  const ranked = rankRecommendationItems({
    adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
    items: candidatePool,
    limit,
    profile,
  });

  return ranked.map(r => r.item);
}

// ============ Fetch Planning ================================================= //

type FetchAllocation = {
  count: number;
  tagSlug: string | null;
};

type FetchPlan = {
  allocations: readonly FetchAllocation[];
};

function computeFetchPlan({ limit, profile }: { limit: number; profile: RecommendationProfile }): FetchPlan {
  const targetPoolSize = Math.ceil(limit * FETCH_LIMITS.candidatesPerResult);
  const affinities = getTopAffinitiesWithScores({ featureType: 'tagTokens', limit: FETCH_LIMITS.maxTags, profile });

  if (affinities.length === 0) {
    return { allocations: [{ count: targetPoolSize, tagSlug: null }] };
  }

  const personalizationStrength = computePersonalizationStrength(profile);
  const personalizedBudget = Math.floor(targetPoolSize * personalizationStrength);
  const trendingCount = targetPoolSize - personalizedBudget;

  const allocations: FetchAllocation[] = [{ count: Math.max(1, trendingCount), tagSlug: null }];

  if (personalizedBudget < FETCH_LIMITS.tagFetchThreshold) {
    return { allocations };
  }

  const totalAffinityScore = affinities.reduce((sum, a) => sum + a.score, 0);
  let remainingBudget = personalizedBudget;

  for (const { key, score } of affinities) {
    const proportion = score / totalAffinityScore;
    const allocation = Math.round(personalizedBudget * proportion);

    if (allocation < FETCH_LIMITS.tagFetchThreshold) break;
    if (remainingBudget < FETCH_LIMITS.tagFetchThreshold) break;

    const count = Math.min(allocation, remainingBudget);
    allocations.push({ count, tagSlug: key });
    remainingBudget -= count;
  }

  return { allocations };
}

function computePersonalizationStrength(profile: RecommendationProfile): number {
  const signalCount = profile.stats.signalCount;
  if (signalCount <= 0) return 0;

  const rampUpSignals = DEFAULT_RECOMMENDATION_TUNING.scoring.personalizationRampUpSignals;
  return 1 - Math.exp(-signalCount / rampUpSignals);
}

// ============ Fetching ======================================================= //

async function fetchCandidatePool({
  abortController,
  plan,
}: {
  abortController: AbortController | null;
  plan: FetchPlan;
}): Promise<PolymarketEvent[]> {
  const fetchPromises = plan.allocations.map(({ count, tagSlug }) => fetchEvents({ abortController, limit: count, tagSlug }));

  const results = await Promise.all(fetchPromises);
  return deduplicateEvents(results.flat());
}

async function fetchEvents({
  abortController,
  limit,
  tagSlug,
}: {
  abortController: AbortController | null;
  limit: number;
  tagSlug: string | null;
}): Promise<PolymarketEvent[]> {
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

  try {
    const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
      abortController,
      timeout: time.seconds(30),
    });

    const activeEvents = events.filter(event => event.ended !== true);
    return Promise.all(activeEvents.map(event => processRawPolymarketEvent(event)));
  } catch {
    return EMPTY_EVENTS;
  }
}

function deduplicateEvents(events: PolymarketEvent[]): PolymarketEvent[] {
  const seen = new Set<string>();
  const unique: PolymarketEvent[] = [];

  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }

  return unique;
}
