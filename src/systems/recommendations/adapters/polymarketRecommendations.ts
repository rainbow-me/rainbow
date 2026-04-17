import { CATEGORIES } from '@/features/polymarket/constants';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { time } from '@/utils/time';
import { RecommendationItemAdapter, RecommendationItemFeatures, TrendingScoreResult } from '../types';
import { normalizeSlug } from '../utils';

// ============ Adapter ======================================================== //

export const POLYMARKET_RECOMMENDATIONS_ADAPTER: RecommendationItemAdapter<PolymarketEvent> = {
  getBaseRelevance: computeBaseRelevance,
  getColdStartBoost: computeColdStartBoost,
  getFeatures: extractFeatures,
  getId: event => event.id,
  getTimelinessBoost: computeTimelinessBoost,
  getTrendingScore: computeTrendingScore,
};

// ============ Base Relevance ================================================= //

const QUALITY_REFERENCE = {
  liquidity: 200_000,
  volumeFallbackDiscount: 0.4,
} as const;

function computeBaseRelevance(event: PolymarketEvent): number {
  const activity = computeActivity(event);
  const quality = computeQualityFactor(event);
  return activity * quality;
}

function computeActivity(event: PolymarketEvent): number {
  const volume24hr = sanitizePositive(event.volume24hr);
  if (volume24hr > 0) return volume24hr;
  return sanitizePositive(event.volume) * QUALITY_REFERENCE.volumeFallbackDiscount;
}

function computeQualityFactor(event: PolymarketEvent): number {
  const liquidity = sanitizePositive(event.liquidity);
  const normalizedLiquidity = Math.min(1, liquidity / QUALITY_REFERENCE.liquidity);
  const competitive = Math.min(1, sanitizePositive(event.competitive));
  return 0.5 + 0.3 * normalizedLiquidity + 0.2 * competitive;
}

// ============ Timeliness Boost =============================================== //

const TIMELINESS_BOOST = {
  baseline: 1.0,
  distant: 0.7,
  imminentResolution: 1.2,
  imminentStart: 1.6,
  live: 2.0,
  upcomingStart: 1.25,
} as const;

const TIMELINESS_WINDOW = {
  distantThreshold: time.days(180),
  imminentResolutionThreshold: time.days(3),
  imminentStartThreshold: time.hours(2),
  upcomingStartThreshold: time.hours(24),
} as const;

function computeTimelinessBoost(event: PolymarketEvent): number {
  const now = Date.now();

  if (event.live === true) return TIMELINESS_BOOST.live;

  const startTime = parseTimestamp(event.startTime);
  if (startTime !== null && startTime > now) {
    const msUntilStart = startTime - now;
    if (msUntilStart <= TIMELINESS_WINDOW.imminentStartThreshold) {
      return TIMELINESS_BOOST.imminentStart;
    }
    if (msUntilStart <= TIMELINESS_WINDOW.upcomingStartThreshold) {
      const progress = 1 - msUntilStart / TIMELINESS_WINDOW.upcomingStartThreshold;
      return TIMELINESS_BOOST.upcomingStart + progress * (TIMELINESS_BOOST.imminentStart - TIMELINESS_BOOST.upcomingStart);
    }
  }

  const endDate = parseTimestamp(event.endDate);
  if (endDate !== null && endDate > now) {
    const msUntilEnd = endDate - now;
    if (msUntilEnd <= TIMELINESS_WINDOW.imminentResolutionThreshold) {
      return TIMELINESS_BOOST.imminentResolution;
    }
    if (msUntilEnd > TIMELINESS_WINDOW.distantThreshold) {
      return TIMELINESS_BOOST.distant;
    }
  }

  return TIMELINESS_BOOST.baseline;
}

// ============ Trending Score ================================================= //

/**
 * Computes a trending score that balances momentum (rate of change) with
 * significance (market size). This produces a balanced ranking where:
 *
 * - Pure momentum doesn't dominate (small markets need higher momentum to rank)
 * - Pure volume doesn't dominate (big markets need some momentum to rank)
 * - The intersection (high momentum on significant markets) ranks highest
 *
 * Formula: trendScore = momentum × significance × quality × recency
 */

const TRENDING_REFERENCE = {
  liquidityReference: 500_000,
  minLiquidity: 5_000,
  minVolume24h: 30_000,
  newEventAgeDays: 7,
  volumeBase: 30_000,
} as const;

const TRENDING_RECENCY_BOOST = {
  baseline: 1.0,
  imminent: 1.2,
  live: 1.3,
} as const;

function computeTrendingScore(event: PolymarketEvent): TrendingScoreResult {
  const v24h = sanitizePositive(event.volume24hr);
  const v1wk = sanitizePositive(event.volume1wk);
  const volume = sanitizePositive(event.volume);
  const liquidity = sanitizePositive(event.liquidity);

  // Filter out low-quality events
  if (v24h < TRENDING_REFERENCE.minVolume24h || liquidity < TRENDING_REFERENCE.minLiquidity) {
    return { components: { momentum: 0, quality: 0, recency: 1, significance: 0 }, score: 0 };
  }

  // 1. Momentum: Age-adjusted rate of change in activity
  const momentum = computeMomentumFactor(event, v24h, v1wk, volume);

  // 2. Significance: Log-scaled volume (larger markets are more noteworthy)
  // $30k = 1.0, $100k = 1.52, $1M = 2.52, $10M = 3.52
  const significance = Math.log10(v24h / TRENDING_REFERENCE.volumeBase + 1);

  // 3. Quality: Liquidity ensures market health
  const quality = 0.6 + 0.4 * Math.min(1, Math.sqrt(liquidity / TRENDING_REFERENCE.liquidityReference));

  // 4. Recency: Boost live and imminent events
  const recency = computeTrendingRecencyBoost(event);

  const score = momentum * significance * quality * recency;

  return { components: { momentum, quality, recency, significance }, score };
}

function computeMomentumFactor(event: PolymarketEvent, v24h: number, v1wk: number, volume: number): number {
  const createdAt = parseTimestamp(event.createdAt);
  const now = Date.now();

  // Calculate event age for baseline adjustment
  const ageMs = createdAt !== null ? now - createdAt : time.days(30);
  const ageDays = Math.max(1, ageMs / time.days(1));
  const isNewEvent = ageDays <= TRENDING_REFERENCE.newEventAgeDays;

  // Determine appropriate daily baseline
  let dailyBaseline: number;
  if (isNewEvent || v1wk >= volume * 0.9) {
    // New event: use age-based baseline to avoid inflated momentum
    dailyBaseline = volume / ageDays;
  } else {
    // Established event: use weekly average
    dailyBaseline = v1wk / 7;
  }

  // Ensure minimum baseline to avoid division issues
  dailyBaseline = Math.max(dailyBaseline, 1000);

  const rawMomentum = v24h / dailyBaseline;

  // Dampen extreme momentum with log transformation
  // Prevents new events from completely dominating
  return 1 + Math.log(1 + rawMomentum);
}

function computeTrendingRecencyBoost(event: PolymarketEvent): number {
  if (event.live === true) {
    return TRENDING_RECENCY_BOOST.live;
  }

  const now = Date.now();
  const startTime = parseTimestamp(event.startTime);

  if (startTime !== null && startTime > now) {
    const hoursUntilStart = (startTime - now) / time.hours(1);
    if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
      return TRENDING_RECENCY_BOOST.imminent;
    }
  }

  return TRENDING_RECENCY_BOOST.baseline;
}

// ============ Cold-Start Category Boost ====================================== //

type CategoryTagId = {
  [K in keyof typeof CATEGORIES]: (typeof CATEGORIES)[K]['tagId'] extends string ? (typeof CATEGORIES)[K]['tagId'] : never;
}[keyof typeof CATEGORIES];

const COLD_START_CATEGORY_BOOST: Record<CategoryTagId, number> = {
  'crypto': 1.1,
  'earnings': 0.8,
  'economy': 0.85,
  'elections': 1,
  'finance': 0.8,
  'geopolitics': 0,
  'mention-markets': 0.5,
  'politics': 1,
  'pop-culture': 1.1,
  'sports': 1.2,
  'tech': 1.1,
  'world': 0.9,
};

function isCategoryTagId(value: string): value is CategoryTagId {
  return value in COLD_START_CATEGORY_BOOST;
}

function computeColdStartBoost(event: PolymarketEvent): number {
  if (event.tags) {
    for (const tag of event.tags) {
      const slug = normalizeSlug(tag.slug);
      if (!slug) continue;

      // Check both forceHide tags and ROOT_CATEGORY_SLUGS for category detection
      if ((tag.forceHide === true || ROOT_CATEGORY_SLUGS.has(slug)) && isCategoryTagId(slug)) {
        return COLD_START_CATEGORY_BOOST[slug];
      }
    }
  }

  const categorySlug = event.category ? normalizeSlug(event.category) : '';
  if (categorySlug && isCategoryTagId(categorySlug)) {
    return COLD_START_CATEGORY_BOOST[categorySlug];
  }

  return 1;
}

// ============ Feature Extraction ============================================= //

function extractFeatures(event: PolymarketEvent): RecommendationItemFeatures {
  const categoryPaths = extractCategoryPaths(event);
  const categorySegmentSet = buildCategorySegmentSet(categoryPaths);
  const tagSlugs = extractTagSlugs(event, categorySegmentSet);
  return { categoryPaths, tagSlugs };
}

const ROOT_CATEGORY_SLUGS: ReadonlySet<string> = new Set(
  Object.values(CATEGORIES).flatMap(category =>
    typeof category.tagId === 'string' && category.tagId.length > 0 ? [category.tagId.toLowerCase()] : []
  )
);

function extractCategoryPaths(event: PolymarketEvent): readonly string[] {
  const paths = new Set<string>();

  if (event.tags) {
    for (const tag of event.tags) {
      const slug = normalizeSlug(tag.slug);
      if (!slug) continue;

      // Capture category-level tags: either forceHide tags or ROOT_CATEGORY_SLUGS
      // ROOT_CATEGORY_SLUGS are semantically categories regardless of forceHide flag
      if (tag.forceHide === true || ROOT_CATEGORY_SLUGS.has(slug)) {
        paths.add(slug);
      }
    }
  }

  if (event.categories) {
    for (const cat of event.categories) {
      const slug = normalizeSlug(cat.slug);
      if (!slug) continue;

      if (cat.parentCategory) {
        const parentSlug = normalizeSlug(cat.parentCategory);
        if (parentSlug) {
          paths.add(`${parentSlug}/${slug}`);
          continue;
        }
      }
      paths.add(slug);
    }
  }

  if (event.category) {
    const categorySlug = normalizeSlug(event.category);
    if (categorySlug && ROOT_CATEGORY_SLUGS.has(categorySlug)) {
      if (event.subcategory) {
        const subcategorySlug = normalizeSlug(event.subcategory);
        if (subcategorySlug) {
          paths.add(`${categorySlug}/${subcategorySlug}`);
        } else {
          paths.add(categorySlug);
        }
      } else {
        paths.add(categorySlug);
      }
    }
  }

  return Array.from(paths);
}

function buildCategorySegmentSet(categoryPaths: readonly string[]): ReadonlySet<string> {
  const segments = new Set<string>();
  for (const path of categoryPaths) {
    for (const segment of path.split('/')) {
      if (segment) segments.add(segment);
    }
  }
  return segments;
}

const TEMPORAL_SLUG_PATTERN = /^(best-of-|.*-predictions$|\d{4}(-|$)|weekly$|monthly$|yearly$|daily$)/;
const ADMINISTRATIVE_SLUG_PATTERN =
  /^(hide-|recurring$|up-or-down$|earn-|multi-strikes$|hit-price$|pre-market$|lighter$|uptspt-|neg-risk$|featured$|macro-)/;

// Generic activity words describe content TYPE (what it is) rather than TOPIC (what it's about).
// These provide no discriminative signal - e.g., "games" appears on 62% of sports events.
const GENERIC_ACTIVITY_WORDS: ReadonlySet<string> = new Set(['all', 'games']);

const EMPTY_SLUGS: readonly string[] = [];

function extractTagSlugs(event: PolymarketEvent, categorySegments: ReadonlySet<string>): readonly string[] {
  if (!event.tags?.length) return EMPTY_SLUGS;

  const slugs = new Set<string>();

  for (const tag of event.tags) {
    if (tag.forceHide === true) continue;

    const slug = normalizeSlug(tag.slug);
    if (!slug) continue;
    if (categorySegments.has(slug)) continue;
    if (ROOT_CATEGORY_SLUGS.has(slug)) continue;
    if (GENERIC_ACTIVITY_WORDS.has(slug)) continue;
    if (TEMPORAL_SLUG_PATTERN.test(slug)) continue;
    if (ADMINISTRATIVE_SLUG_PATTERN.test(slug)) continue;

    slugs.add(slug);
  }

  return Array.from(slugs);
}

// ============ Utilities ====================================================== //

function sanitizePositive(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function parseTimestamp(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
