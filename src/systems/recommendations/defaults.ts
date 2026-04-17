import { time } from '@/utils/time';
import { RecommendationProfile, RecommendationTuning, RECOMMENDATION_PROFILE_VERSION } from './types';

// ============ Default Tuning ================================================= //

/** Default tuning values. See {@link RecommendationTuning} for parameter documentation. */
export const DEFAULT_RECOMMENDATION_TUNING: RecommendationTuning = {
  affinity: {
    decayHalfLifeMs: { categorySegment: time.days(30), tagToken: time.days(30) },
    maxEntries: { categorySegment: 128, tagToken: 256 },
    maxScore: { categorySegment: 24, tagToken: 30 },
    minRetainedScore: 0.05,
  },

  diversification: {
    affinityDecayReduction: 0.8,
    categoryDecay: 0.15,
    enabled: true,
    tagDecay: 0.1,
  },

  scoring: {
    baseRelevanceSaturation: 16,
    categoryGating: 2,
    personalization: 1,
    personalAffinitySaturation: 12,
    personalBoostCeiling: 1,
    personalizationRampUpSignals: 12,
    weights: { categorySegment: 0.1, tagToken: 1 },
  },

  signals: {
    commitmentMagnitudeBoost: { fullBoostThreshold: 50, maxMultiplier: 2.0 },
    viewDurationBoost: { fullBoostThresholdMs: time.seconds(45), maxMultiplier: 1.5 },
    weights: {
      categoryViewed: { categorySegment: 0.1, tagToken: 0 },
      itemBookmarked: { categorySegment: 0.1, tagToken: 2 },
      itemCommitted: { categorySegment: 0.2, tagToken: 4 },
      itemUnbookmarked: { categorySegment: -0.1, tagToken: -2 },
      itemViewed: { categorySegment: 0.005, tagToken: 0.1 },
    },
  },
};

// ============ Profile Factory ================================================ //

export function createEmptyRecommendationProfile(): RecommendationProfile {
  return {
    affinities: {
      categorySegments: {},
      tagTokens: {},
    },
    schemaVersion: RECOMMENDATION_PROFILE_VERSION,
    stats: {
      lastSignalAtMs: null,
      signalCount: 0,
    },
  };
}

// ============ Tuning Factory ================================================= //

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export function createRecommendationTuning(overrides: DeepPartial<RecommendationTuning>): RecommendationTuning {
  validateTuningOverrides(overrides);
  return deepMerge(DEFAULT_RECOMMENDATION_TUNING, overrides);
}

function validateTuningOverrides(overrides: DeepPartial<RecommendationTuning>): void {
  if (overrides.affinity?.decayHalfLifeMs) {
    const decay = overrides.affinity.decayHalfLifeMs;
    if (decay.categorySegment !== undefined && decay.categorySegment <= 0) {
      throw new Error('[createRecommendationTuning] decayHalfLifeMs.categorySegment must be positive');
    }
    if (decay.tagToken !== undefined && decay.tagToken <= 0) {
      throw new Error('[createRecommendationTuning] decayHalfLifeMs.tagToken must be positive');
    }
  }

  if (overrides.affinity?.maxEntries) {
    const entries = overrides.affinity.maxEntries;
    if (entries.categorySegment !== undefined && entries.categorySegment < 0) {
      throw new Error('[createRecommendationTuning] maxEntries.categorySegment must be non-negative');
    }
    if (entries.tagToken !== undefined && entries.tagToken < 0) {
      throw new Error('[createRecommendationTuning] maxEntries.tagToken must be non-negative');
    }
  }

  if (overrides.scoring?.personalizationRampUpSignals !== undefined) {
    if (overrides.scoring.personalizationRampUpSignals < 0) {
      throw new Error('[createRecommendationTuning] personalizationRampUpSignals must be non-negative');
    }
  }

  if (overrides.scoring?.baseRelevanceSaturation !== undefined) {
    if (overrides.scoring.baseRelevanceSaturation <= 0) {
      throw new Error('[createRecommendationTuning] baseRelevanceSaturation must be positive');
    }
  }

  if (overrides.scoring?.categoryGating !== undefined) {
    if (overrides.scoring.categoryGating < 0) {
      throw new Error('[createRecommendationTuning] categoryGating must be non-negative');
    }
  }

  if (overrides.scoring?.personalAffinitySaturation !== undefined) {
    if (overrides.scoring.personalAffinitySaturation <= 0) {
      throw new Error('[createRecommendationTuning] personalAffinitySaturation must be positive');
    }
  }

  if (overrides.scoring?.personalBoostCeiling !== undefined) {
    if (overrides.scoring.personalBoostCeiling < 0) {
      throw new Error('[createRecommendationTuning] personalBoostCeiling must be non-negative');
    }
  }

  if (overrides.diversification?.categoryDecay !== undefined) {
    if (overrides.diversification.categoryDecay < 0) {
      throw new Error('[createRecommendationTuning] categoryDecay must be non-negative');
    }
  }

  if (overrides.diversification?.tagDecay !== undefined) {
    if (overrides.diversification.tagDecay < 0) {
      throw new Error('[createRecommendationTuning] tagDecay must be non-negative');
    }
  }

  if (overrides.diversification?.affinityDecayReduction !== undefined) {
    if (overrides.diversification.affinityDecayReduction < 0 || overrides.diversification.affinityDecayReduction > 1) {
      throw new Error('[createRecommendationTuning] affinityDecayReduction must be between 0 and 1');
    }
  }

  if (overrides.scoring?.personalization !== undefined) {
    if (overrides.scoring.personalization < 0 || overrides.scoring.personalization > 1) {
      throw new Error('[createRecommendationTuning] personalization must be between 0 and 1');
    }
  }
}

function deepMerge<T extends Record<string, unknown>>(base: T, overrides: DeepPartial<T>): T {
  const result = Object.assign(Object.create(null), base);

  for (const key of Object.keys(overrides)) {
    const overrideValue = overrides[key];
    if (overrideValue === undefined) continue;

    const baseValue = base[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
