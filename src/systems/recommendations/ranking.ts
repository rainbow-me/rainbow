import { DEFAULT_RECOMMENDATION_TUNING } from './defaults';
import {
  RecommendationItemAdapter,
  RecommendationProfile,
  RecommendationScoreComponents,
  RecommendationScoredItem,
  RecommendationTuning,
} from './types';
import { clampNumber, extractWeightedSegmentsFromPaths, getDecayedScore, normalizeSlugs, WeightedSegment } from './utils';

// ============ Constants ====================================================== //

const UNCATEGORIZED_SEGMENT = '__uncategorized__';

// ============ Public API ===================================================== //

export function rankRecommendationItems<T>({
  adapter,
  items,
  limit,
  nowMs = Date.now(),
  profile,
  tuning = DEFAULT_RECOMMENDATION_TUNING,
}: {
  adapter: RecommendationItemAdapter<T>;
  items: readonly T[];
  limit: number;
  nowMs?: number;
  profile: RecommendationProfile;
  tuning?: RecommendationTuning;
}): readonly RecommendationScoredItem<T>[] {
  const safeLimit = Math.max(0, Math.min(items.length, Math.floor(limit)));
  if (safeLimit === 0) return [];

  const personalizationStrength = computePersonalizationStrength({
    personalization: tuning.scoring.personalization,
    rampUpSignals: tuning.scoring.personalizationRampUpSignals,
    signalCount: profile.stats.signalCount,
  });

  const prepared = prepareRecommendationItems({
    adapter,
    items,
    nowMs,
    personalizationStrength,
    profile,
    tuning,
  });

  prepared.sort((a, b) => comparePreparedItemsDescending({ a, b }));

  const selected = tuning.diversification.enabled
    ? selectDiversifiedTopItems({ items: prepared, limit: safeLimit, profile, tuning })
    : prepared.slice(0, safeLimit);

  return selected.map(item => ({
    id: item.id,
    item: item.item,
    score: item.score,
    scoreComponents: item.scoreComponents,
  }));
}

// ============ Internal Types ================================================= //

type NormalizedFeatures = {
  categorySegments: readonly WeightedSegment[];
  tagSlugs: readonly string[];
};

type PreparedRecommendationItem<T> = {
  features: NormalizedFeatures;
  id: string;
  item: T;
  originalIndex: number;
  score: number;
  scoreComponents: RecommendationScoreComponents;
};

// ============ Preparation ==================================================== //

function prepareRecommendationItems<T>({
  adapter,
  items,
  nowMs,
  personalizationStrength,
  profile,
  tuning,
}: {
  adapter: RecommendationItemAdapter<T>;
  items: readonly T[];
  nowMs: number;
  personalizationStrength: number;
  profile: RecommendationProfile;
  tuning: RecommendationTuning;
}): PreparedRecommendationItem<T>[] {
  const prepared: PreparedRecommendationItem<T>[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const id = adapter.getId(item);
    const rawFeatures = adapter.getFeatures(item);

    const categoryPaths = normalizeSlugs({ slugs: rawFeatures.categoryPaths });
    const categorySegments = extractWeightedSegmentsFromPaths({ paths: categoryPaths });
    const tagSlugs = normalizeSlugs({ slugs: rawFeatures.tagSlugs });
    const features: NormalizedFeatures = { categorySegments, tagSlugs };

    const scoreComponents = computeScoreComponents({
      adapter,
      features,
      item,
      nowMs,
      personalizationStrength,
      profile,
      tuning,
    });

    const score =
      scoreComponents.baseRelevance * scoreComponents.personalBoost * scoreComponents.timelinessBoost * scoreComponents.coldStartBoost;

    prepared.push({ features, id, item, originalIndex: i, score, scoreComponents });
  }

  return prepared;
}

// ============ Score Components =============================================== //

function computeScoreComponents<T>({
  adapter,
  features,
  item,
  nowMs,
  personalizationStrength,
  profile,
  tuning,
}: {
  adapter: RecommendationItemAdapter<T>;
  features: NormalizedFeatures;
  item: T;
  nowMs: number;
  personalizationStrength: number;
  profile: RecommendationProfile;
  tuning: RecommendationTuning;
}): RecommendationScoreComponents {
  const rawBaseRelevance = Math.max(0, adapter.getBaseRelevance(item));
  const baseRelevance = normalizeBaseRelevance({
    rawValue: rawBaseRelevance,
    saturation: tuning.scoring.baseRelevanceSaturation,
  });

  const rawPersonalAffinity = computeRawPersonalAffinity({ features, nowMs, profile, tuning });
  const normalizedAffinity = clampNumber({
    max: 1,
    min: 0,
    value: Math.tanh(rawPersonalAffinity / tuning.scoring.personalAffinitySaturation),
  });
  const personalBoost = computePersonalBoostFromNormalized({
    ceiling: tuning.scoring.personalBoostCeiling,
    normalizedAffinity,
    personalizationStrength,
  });

  const rawTimelinessBoost = Math.max(0, adapter.getTimelinessBoost?.(item) ?? 1);
  const timelinessBoost = computePersonalizedTimeliness({
    normalizedAffinity,
    personalizationStrength,
    rawTimeliness: rawTimelinessBoost,
  });

  const rawColdStartBoost = adapter.getColdStartBoost?.(item) ?? 1;
  const coldStartBoost = computeColdStartBoost({
    personalizationStrength,
    rawBoost: rawColdStartBoost,
  });

  return { baseRelevance, coldStartBoost, personalBoost, timelinessBoost };
}

function normalizeBaseRelevance({ rawValue, saturation }: { rawValue: number; saturation: number }): number {
  if (saturation <= 0 || rawValue <= 0) return 0;
  const compressed = Math.log1p(rawValue);
  return clampNumber({ max: 1, min: 0, value: Math.tanh(compressed / saturation) });
}

function computeRawPersonalAffinity({
  features,
  nowMs,
  profile,
  tuning,
}: {
  features: NormalizedFeatures;
  nowMs: number;
  profile: RecommendationProfile;
  tuning: RecommendationTuning;
}): number {
  const categoryAffinity = scoreWeightedSegments({
    halfLifeMs: tuning.affinity.decayHalfLifeMs.categorySegment,
    nowMs,
    profileScoresByKey: profile.affinities.categorySegments,
    weightedSegments: features.categorySegments,
  });

  const tagAffinity = scoreTagSlugs({
    halfLifeMs: tuning.affinity.decayHalfLifeMs.tagToken,
    nowMs,
    profileScoresByKey: profile.affinities.tagTokens,
    slugs: features.tagSlugs,
  });

  const tagContrib = tuning.scoring.weights.tagToken * tagAffinity;
  const categoryContrib = tuning.scoring.weights.categorySegment * categoryAffinity;
  const categoryGatingFactor = tagAffinity / (tagAffinity + tuning.scoring.categoryGating);

  return tagContrib + categoryContrib * categoryGatingFactor;
}

function computePersonalBoostFromNormalized({
  ceiling,
  normalizedAffinity,
  personalizationStrength,
}: {
  ceiling: number;
  normalizedAffinity: number;
  personalizationStrength: number;
}): number {
  if (normalizedAffinity <= 0 || ceiling <= 0) return 1;
  const maxBoost = personalizationStrength * ceiling;
  return 1 + normalizedAffinity * maxBoost;
}

function computePersonalizedTimeliness({
  normalizedAffinity,
  personalizationStrength,
  rawTimeliness,
}: {
  normalizedAffinity: number;
  personalizationStrength: number;
  rawTimeliness: number;
}): number {
  if (rawTimeliness <= 1) return rawTimeliness;

  const effectiveWeight = 1 - personalizationStrength + personalizationStrength * normalizedAffinity;

  return 1 + (rawTimeliness - 1) * effectiveWeight;
}

function computeColdStartBoost({ personalizationStrength, rawBoost }: { personalizationStrength: number; rawBoost: number }): number {
  if (rawBoost === 1) return 1;
  const fadeFactor = 1 - personalizationStrength;
  return 1 + fadeFactor * (rawBoost - 1);
}

// ============ Affinity Scoring =============================================== //

function scoreWeightedSegments({
  halfLifeMs,
  nowMs,
  profileScoresByKey,
  weightedSegments,
}: {
  halfLifeMs: number;
  nowMs: number;
  profileScoresByKey: Record<string, { score: number; updatedAtMs: number }>;
  weightedSegments: readonly WeightedSegment[];
}): number {
  if (weightedSegments.length === 0) return 0;

  let sum = 0;
  for (const { segment, weight } of weightedSegments) {
    const entry = profileScoresByKey[segment];
    if (!entry) continue;
    const decayed = getDecayedScore({ halfLifeMs, nowMs, previous: entry });
    sum += decayed * weight;
  }

  return sum;
}

function scoreTagSlugs({
  halfLifeMs,
  nowMs,
  profileScoresByKey,
  slugs,
}: {
  halfLifeMs: number;
  nowMs: number;
  profileScoresByKey: Record<string, { score: number; updatedAtMs: number }>;
  slugs: readonly string[];
}): number {
  const count = slugs.length;
  if (count === 0) return 0;

  let sum = 0;
  for (const slug of slugs) {
    const entry = profileScoresByKey[slug];
    if (!entry) continue;
    sum += getDecayedScore({ halfLifeMs, nowMs, previous: entry });
  }

  return sum / count;
}

// ============ Personalization Strength ======================================= //

function computePersonalizationStrength({
  personalization,
  rampUpSignals,
  signalCount,
}: {
  personalization: number;
  rampUpSignals: number;
  signalCount: number;
}): number {
  if (personalization <= 0 || signalCount <= 0) return 0;
  const signalStrength = rampUpSignals <= 0 ? 1 : 1 - Math.exp(-signalCount / rampUpSignals);
  return clampNumber({ max: 1, min: 0, value: personalization * signalStrength });
}

// ============ Sorting ======================================================== //

function comparePreparedItemsDescending<T>({ a, b }: { a: PreparedRecommendationItem<T>; b: PreparedRecommendationItem<T> }): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.scoreComponents.baseRelevance !== b.scoreComponents.baseRelevance) {
    return b.scoreComponents.baseRelevance - a.scoreComponents.baseRelevance;
  }
  return a.originalIndex - b.originalIndex;
}

// ============ Diversification ================================================ //

function selectDiversifiedTopItems<T>({
  items,
  limit,
  profile,
  tuning,
}: {
  items: PreparedRecommendationItem<T>[];
  limit: number;
  profile: RecommendationProfile;
  tuning: RecommendationTuning;
}): PreparedRecommendationItem<T>[] {
  const { categoryDecay, tagDecay, affinityDecayReduction } = tuning.diversification;

  const categoryAffinities = computeCategoryAffinities({
    halfLifeMs: tuning.affinity.decayHalfLifeMs.categorySegment,
    maxScore: tuning.affinity.maxScore.categorySegment,
    nowMs: Date.now(),
    profile,
  });

  const tagAffinities = computeTagAffinities({
    halfLifeMs: tuning.affinity.decayHalfLifeMs.tagToken,
    maxScore: tuning.affinity.maxScore.tagToken,
    nowMs: Date.now(),
    profile,
  });

  const remaining = items.slice();
  const selected: PreparedRecommendationItem<T>[] = [];
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestEffectiveScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const primaryCategory = getPrimaryCategorySlug(candidate.features);
      const primaryTag = candidate.features.tagSlugs[0];

      const categoryAffinity = categoryAffinities.get(primaryCategory) ?? 0;
      const tagAffinity = primaryTag ? tagAffinities.get(primaryTag) ?? 0 : 0;

      const effectiveCategoryDecay = categoryDecay * (1 - categoryAffinity * affinityDecayReduction);
      const effectiveTagDecay = tagDecay * (1 - tagAffinity * affinityDecayReduction);

      const categoryCount = categoryCounts.get(primaryCategory) ?? 0;
      const tagCount = primaryTag ? tagCounts.get(primaryTag) ?? 0 : 0;

      const categoryFactor = 1 / (1 + categoryCount * effectiveCategoryDecay);
      const tagFactor = 1 / (1 + tagCount * effectiveTagDecay);

      const effectiveScore = candidate.score * categoryFactor * tagFactor;

      if (effectiveScore > bestEffectiveScore) {
        bestEffectiveScore = effectiveScore;
        bestIndex = i;
      } else if (effectiveScore === bestEffectiveScore && candidate.originalIndex < remaining[bestIndex].originalIndex) {
        bestIndex = i;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    selected.push(picked);

    const primaryCategory = getPrimaryCategorySlug(picked.features);
    categoryCounts.set(primaryCategory, (categoryCounts.get(primaryCategory) ?? 0) + 1);

    const primaryTag = picked.features.tagSlugs[0];
    if (primaryTag) {
      tagCounts.set(primaryTag, (tagCounts.get(primaryTag) ?? 0) + 1);
    }
  }

  return selected;
}

function computeCategoryAffinities({
  halfLifeMs,
  maxScore,
  nowMs,
  profile,
}: {
  halfLifeMs: number;
  maxScore: number;
  nowMs: number;
  profile: RecommendationProfile;
}): Map<string, number> {
  const affinities = new Map<string, number>();
  for (const [key, entry] of Object.entries(profile.affinities.categorySegments)) {
    const decayed = getDecayedScore({ halfLifeMs, nowMs, previous: entry });
    affinities.set(key, clampNumber({ max: 1, min: 0, value: decayed / maxScore }));
  }
  return affinities;
}

function computeTagAffinities({
  halfLifeMs,
  maxScore,
  nowMs,
  profile,
}: {
  halfLifeMs: number;
  maxScore: number;
  nowMs: number;
  profile: RecommendationProfile;
}): Map<string, number> {
  const affinities = new Map<string, number>();
  for (const [key, entry] of Object.entries(profile.affinities.tagTokens)) {
    const decayed = getDecayedScore({ halfLifeMs, nowMs, previous: entry });
    affinities.set(key, clampNumber({ max: 1, min: 0, value: decayed / maxScore }));
  }
  return affinities;
}

function getPrimaryCategorySlug(features: NormalizedFeatures): string {
  if (features.categorySegments.length === 0) return UNCATEGORIZED_SEGMENT;

  let maxWeight = -1;
  let primary = UNCATEGORIZED_SEGMENT;

  for (const { segment, weight } of features.categorySegments) {
    if (weight > maxWeight) {
      maxWeight = weight;
      primary = segment;
    }
  }

  return primary;
}

// ============ Trending Ranking =============================================== //

export type TrendingScoredItem<T> = {
  id: string;
  item: T;
  score: number;
};

export function rankByTrending<T>({
  adapter,
  items,
  limit,
}: {
  adapter: RecommendationItemAdapter<T>;
  items: readonly T[];
  limit: number;
}): readonly TrendingScoredItem<T>[] {
  const getTrendingScore = adapter.getTrendingScore;
  if (!getTrendingScore) {
    return items.slice(0, limit).map(item => ({
      id: adapter.getId(item),
      item,
      score: 0,
    }));
  }

  const scored: TrendingScoredItem<T>[] = [];

  for (const item of items) {
    const result = getTrendingScore(item);
    if (result.score <= 0) continue;
    scored.push({ id: adapter.getId(item), item, score: result.score });
  }

  scored.sort(compareTrendingItemsDescending);

  return scored.slice(0, limit);
}

function compareTrendingItemsDescending<T>(a: TrendingScoredItem<T>, b: TrendingScoredItem<T>): number {
  return b.score - a.score;
}
