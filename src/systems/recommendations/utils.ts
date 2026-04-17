import { DEFAULT_RECOMMENDATION_TUNING } from './defaults';
import { RecommendationProfile, TimeWeightedScore } from './types';

// ============ String Utilities =============================================== //

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function normalizeSlugs({ slugs }: { slugs: readonly string[] }): readonly string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const value = normalizeSlug(slug);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

// ============ Category Segment Extraction ==================================== //

export type WeightedSegment = {
  segment: string;
  weight: number;
};

export function extractWeightedSegments({ path }: { path: string }): readonly WeightedSegment[] {
  const normalized = normalizeSlug(path);
  if (!normalized) return [];

  const segments = normalized.split('/').filter(s => s.length > 0);
  const n = segments.length;
  if (n === 0) return [];

  const denominator = n * (n + 1);
  return segments.map((segment, i) => ({
    segment,
    weight: (2 * (i + 1)) / denominator,
  }));
}

export function extractWeightedSegmentsFromPaths({ paths }: { paths: readonly string[] }): readonly WeightedSegment[] {
  const segmentWeights = new Map<string, number>();

  for (const path of paths) {
    for (const { segment, weight } of extractWeightedSegments({ path })) {
      segmentWeights.set(segment, (segmentWeights.get(segment) ?? 0) + weight);
    }
  }

  const totalWeight = Array.from(segmentWeights.values()).reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return [];

  const result: WeightedSegment[] = [];
  for (const [segment, weight] of segmentWeights) {
    result.push({ segment, weight: weight / totalWeight });
  }

  return result;
}

// ============ Math =========================================================== //

export function clampNumber({ max, min, value }: { max: number; min: number; value: number }): number {
  if (value <= min) return min;
  if (value >= max) return max;
  return value;
}

export function getDecayedScore({
  halfLifeMs,
  nowMs,
  previous,
}: {
  halfLifeMs: number;
  nowMs: number;
  previous: TimeWeightedScore;
}): number {
  if (halfLifeMs <= 0) return 0;
  if (nowMs <= previous.updatedAtMs) return previous.score;

  const dtMs = nowMs - previous.updatedAtMs;
  const decayMultiplier = Math.pow(0.5, dtMs / halfLifeMs);
  return previous.score * decayMultiplier;
}

// ============ Affinity Extraction ============================================ //

export type AffinityFeatureType = 'categorySegments' | 'tagTokens';

export type ScoredAffinity = {
  readonly key: string;
  readonly score: number;
};

export function getTopAffinities({
  featureType,
  limit,
  nowMs = Date.now(),
  profile,
}: {
  featureType: AffinityFeatureType;
  limit: number;
  nowMs?: number;
  profile: RecommendationProfile;
}): readonly string[] {
  return getTopAffinitiesWithScores({ featureType, limit, nowMs, profile }).map(a => a.key);
}

export function getTopAffinitiesWithScores({
  featureType,
  limit,
  nowMs = Date.now(),
  profile,
}: {
  featureType: AffinityFeatureType;
  limit: number;
  nowMs?: number;
  profile: RecommendationProfile;
}): readonly ScoredAffinity[] {
  const affinityMap = profile.affinities[featureType];
  const halfLifeMs = getHalfLifeForFeatureType(featureType);

  const scored: ScoredAffinity[] = [];

  for (const key of Object.keys(affinityMap)) {
    const entry = affinityMap[key];
    const score = getDecayedScore({ halfLifeMs, nowMs, previous: entry });
    if (score > 0) {
      scored.push({ key, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function getHalfLifeForFeatureType(featureType: AffinityFeatureType): number {
  switch (featureType) {
    case 'categorySegments':
      return DEFAULT_RECOMMENDATION_TUNING.affinity.decayHalfLifeMs.categorySegment;
    case 'tagTokens':
      return DEFAULT_RECOMMENDATION_TUNING.affinity.decayHalfLifeMs.tagToken;
  }
}
