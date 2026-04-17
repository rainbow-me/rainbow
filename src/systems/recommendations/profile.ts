import { DEFAULT_RECOMMENDATION_TUNING } from './defaults';
import {
  ItemSignal,
  RecommendationFeatureWeights,
  RecommendationItemAdapter,
  RecommendationItemFeatures,
  RecommendationProfile,
  RecommendationTuning,
  SignalKind,
  TimeWeightedScore,
} from './types';
import { clampNumber, extractWeightedSegmentsFromPaths, getDecayedScore, normalizeSlugs, WeightedSegment } from './utils';

// ============ Public API ===================================================== //

export function recordCategoryView({
  categoryPath,
  occurredAtMs = Date.now(),
  profile,
  tuning = DEFAULT_RECOMMENDATION_TUNING,
}: {
  categoryPath: readonly string[];
  occurredAtMs?: number;
  profile: RecommendationProfile;
  tuning?: RecommendationTuning;
}): RecommendationProfile {
  const normalizedSlugs = normalizeSlugs({ slugs: categoryPath });
  const leafPath = normalizedSlugs.join('/');
  const features: RecommendationItemFeatures = {
    categoryPaths: leafPath ? [leafPath] : [],
    tagSlugs: [],
  };

  return applySignalToProfile({
    deltaWeights: tuning.signals.weights.categoryViewed,
    features,
    occurredAtMs,
    profile,
    tuning,
  });
}

export function recordItemSignal<T>({
  adapter,
  profile,
  signal,
  tuning = DEFAULT_RECOMMENDATION_TUNING,
}: {
  adapter: RecommendationItemAdapter<T>;
  profile: RecommendationProfile;
  signal: ItemSignal<T>;
  tuning?: RecommendationTuning;
}): RecommendationProfile {
  const features = adapter.getFeatures(signal.item);
  const deltaWeights = getDeltaWeightsForItemSignal({ signal, tuning });

  return applySignalToProfile({
    deltaWeights,
    features,
    occurredAtMs: signal.occurredAtMs,
    profile,
    tuning,
  });
}

export function recordItemSignals<T>({
  adapter,
  profile,
  signals,
  tuning = DEFAULT_RECOMMENDATION_TUNING,
}: {
  adapter: RecommendationItemAdapter<T>;
  profile: RecommendationProfile;
  signals: readonly ItemSignal<T>[];
  tuning?: RecommendationTuning;
}): RecommendationProfile {
  let nextProfile = profile;
  for (const signal of signals) {
    nextProfile = recordItemSignal({ adapter, profile: nextProfile, signal, tuning });
  }
  return nextProfile;
}

// ============ Signal Weights ================================================= //

function getDeltaWeightsForItemSignal<T>({
  signal,
  tuning,
}: {
  signal: ItemSignal<T>;
  tuning: RecommendationTuning;
}): RecommendationFeatureWeights {
  switch (signal.kind) {
    case SignalKind.ITEM_COMMITTED: {
      const magnitudeBoost = getCommitmentMagnitudeBoostMultiplier({ magnitude: signal.magnitude, tuning });
      return scaleWeights({ multiplier: magnitudeBoost, weights: tuning.signals.weights.itemCommitted });
    }
    case SignalKind.ITEM_BOOKMARKED:
      return tuning.signals.weights.itemBookmarked;
    case SignalKind.ITEM_UNBOOKMARKED:
      return tuning.signals.weights.itemUnbookmarked;
    case SignalKind.ITEM_VIEWED: {
      const durationBoost = getViewDurationBoostMultiplier({ dwellMs: signal.dwellMs, tuning });
      return scaleWeights({ multiplier: durationBoost, weights: tuning.signals.weights.itemViewed });
    }
  }
}

function getViewDurationBoostMultiplier({ dwellMs, tuning }: { dwellMs: number | undefined; tuning: RecommendationTuning }): number {
  if (!dwellMs || dwellMs <= 0) return 1;

  const { fullBoostThresholdMs, maxMultiplier: maxMult } = tuning.signals.viewDurationBoost;
  if (fullBoostThresholdMs <= 0) return 1;

  const maxMultiplier = Math.max(1, maxMult);
  const progress = Math.log1p(dwellMs) / Math.log1p(fullBoostThresholdMs);
  const multiplier = 1 + (maxMultiplier - 1) * progress;
  return clampNumber({ max: maxMultiplier, min: 1, value: multiplier });
}

function getCommitmentMagnitudeBoostMultiplier({
  magnitude,
  tuning,
}: {
  magnitude: number | undefined;
  tuning: RecommendationTuning;
}): number {
  if (!magnitude || magnitude <= 0) return 1;

  const { fullBoostThreshold, maxMultiplier: maxMult } = tuning.signals.commitmentMagnitudeBoost;
  if (fullBoostThreshold <= 0) return 1;

  const maxMultiplier = Math.max(1, maxMult);
  const progress = Math.log1p(magnitude) / Math.log1p(fullBoostThreshold);
  const multiplier = 1 + (maxMultiplier - 1) * progress;
  return clampNumber({ max: maxMultiplier, min: 1, value: multiplier });
}

function scaleWeights({
  multiplier,
  weights,
}: {
  multiplier: number;
  weights: RecommendationFeatureWeights;
}): RecommendationFeatureWeights {
  return {
    categorySegment: weights.categorySegment * multiplier,
    tagToken: weights.tagToken * multiplier,
  };
}

// ============ Tag Filtering ================================================== //

function filterTagSlugs(slugs: readonly string[], excludeSet: ReadonlySet<string>): readonly string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    if (!slug || excludeSet.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }

  return result;
}

// ============ Core Update Logic ============================================== //

function applySignalToProfile({
  deltaWeights,
  features,
  occurredAtMs,
  profile,
  tuning,
}: {
  deltaWeights: RecommendationFeatureWeights;
  features: RecommendationItemFeatures;
  occurredAtMs: number;
  profile: RecommendationProfile;
  tuning: RecommendationTuning;
}): RecommendationProfile {
  const categoryPaths = normalizeSlugs({ slugs: features.categoryPaths });
  const categorySegments = extractWeightedSegmentsFromPaths({ paths: categoryPaths });

  const allCategorySegments = new Set<string>(Object.keys(profile.affinities.categorySegments));
  for (const { segment } of categorySegments) {
    allCategorySegments.add(segment);
  }

  const tagSlugs = filterTagSlugs(features.tagSlugs, allCategorySegments);
  const tagSlugWeight = tagSlugs.length > 0 ? 1 / tagSlugs.length : 0;

  const hasCategorySignal = categorySegments.length > 0 && deltaWeights.categorySegment !== 0;
  const hasTagSignal = tagSlugs.length > 0 && deltaWeights.tagToken !== 0;

  if (!hasCategorySignal && !hasTagSignal) return profile;

  const nextCategorySegments = hasCategorySignal
    ? applyWeightedDeltaAndPrune({
        baseDelta: deltaWeights.categorySegment,
        halfLifeMs: tuning.affinity.decayHalfLifeMs.categorySegment,
        maxEntries: tuning.affinity.maxEntries.categorySegment,
        maxScore: tuning.affinity.maxScore.categorySegment,
        minRetainedScore: tuning.affinity.minRetainedScore,
        nowMs: occurredAtMs,
        previousByKey: profile.affinities.categorySegments,
        weightedKeys: categorySegments,
      })
    : profile.affinities.categorySegments;

  const tagWeightedKeys: readonly WeightedSegment[] = tagSlugs.map(slug => ({
    segment: slug,
    weight: tagSlugWeight,
  }));

  const nextTagSlugs = hasTagSignal
    ? applyWeightedDeltaAndPrune({
        baseDelta: deltaWeights.tagToken,
        halfLifeMs: tuning.affinity.decayHalfLifeMs.tagToken,
        maxEntries: tuning.affinity.maxEntries.tagToken,
        maxScore: tuning.affinity.maxScore.tagToken,
        minRetainedScore: tuning.affinity.minRetainedScore,
        nowMs: occurredAtMs,
        previousByKey: profile.affinities.tagTokens,
        weightedKeys: tagWeightedKeys,
      })
    : profile.affinities.tagTokens;

  const didUpdate = nextCategorySegments !== profile.affinities.categorySegments || nextTagSlugs !== profile.affinities.tagTokens;

  if (!didUpdate) return profile;

  return {
    ...profile,
    affinities: {
      categorySegments: nextCategorySegments,
      tagTokens: nextTagSlugs,
    },
    stats: {
      lastSignalAtMs: occurredAtMs,
      signalCount: profile.stats.signalCount + 1,
    },
  };
}

// ============ Weighted Delta + Prune ========================================= //

function applyWeightedDeltaAndPrune({
  baseDelta,
  halfLifeMs,
  maxEntries,
  maxScore,
  minRetainedScore,
  nowMs,
  previousByKey,
  weightedKeys,
}: {
  baseDelta: number;
  halfLifeMs: number;
  maxEntries: number;
  maxScore: number;
  minRetainedScore: number;
  nowMs: number;
  previousByKey: Record<string, TimeWeightedScore>;
  weightedKeys: readonly WeightedSegment[];
}): Record<string, TimeWeightedScore> {
  if (baseDelta === 0 && weightedKeys.length === 0) return previousByKey;

  const keyDeltas = new Map<string, number>();
  for (const { segment, weight } of weightedKeys) {
    keyDeltas.set(segment, (keyDeltas.get(segment) ?? 0) + baseDelta * weight);
  }

  const allKeys = new Set(Object.keys(previousByKey));
  for (const key of keyDeltas.keys()) {
    allKeys.add(key);
  }

  const entries: Array<{ decayedScore: number; key: string; score: TimeWeightedScore }> = [];

  for (const key of Array.from(allKeys)) {
    const previous = previousByKey[key];
    const delta = keyDeltas.get(key) ?? 0;

    let decayedScore: number;
    let nextScore: TimeWeightedScore;

    if (previous) {
      decayedScore = getDecayedScore({ halfLifeMs, nowMs, previous });
      if (delta !== 0) {
        const newValue = clampNumber({ max: maxScore, min: 0, value: decayedScore + delta });
        decayedScore = newValue;
        nextScore = { score: newValue, updatedAtMs: nowMs };
      } else {
        nextScore = previous;
      }
    } else if (delta > 0) {
      const newValue = clampNumber({ max: maxScore, min: 0, value: delta });
      decayedScore = newValue;
      nextScore = { score: newValue, updatedAtMs: nowMs };
    } else {
      continue;
    }

    if (decayedScore >= minRetainedScore) {
      entries.push({ decayedScore, key, score: nextScore });
    }
  }

  if (entries.length === Object.keys(previousByKey).length && entries.length <= maxEntries) {
    let unchanged = true;
    for (const entry of entries) {
      const prev = previousByKey[entry.key];
      if (!prev || prev !== entry.score) {
        unchanged = false;
        break;
      }
    }
    if (unchanged) return previousByKey;
  }

  entries.sort((a, b) => b.decayedScore - a.decayedScore);

  const next: Record<string, TimeWeightedScore> = {};
  const keepCount = Math.min(entries.length, Math.max(0, maxEntries));

  for (let i = 0; i < keepCount; i += 1) {
    const entry = entries[i];
    next[entry.key] = entry.score;
  }

  return next;
}
