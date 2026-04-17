// ============ Version ======================================================== //

export const RECOMMENDATION_PROFILE_VERSION = 1 as const;

export type RecommendationProfileVersion = typeof RECOMMENDATION_PROFILE_VERSION;

// ============ Core Types ===================================================== //

export type TimeWeightedScore = {
  score: number;
  updatedAtMs: number;
};

export type RecommendationItemFeatures = {
  categoryPaths: readonly string[];
  tagSlugs: readonly string[];
};

export type RecommendationItemAdapter<T> = {
  getBaseRelevance: (item: T) => number;
  getColdStartBoost?: (item: T) => number;
  getFeatures: (item: T) => RecommendationItemFeatures;
  getId: (item: T) => string;
  getTimelinessBoost?: (item: T) => number;
  getTrendingScore?: (item: T) => TrendingScoreResult;
};

export type TrendingScoreComponents = {
  momentum: number;
  quality: number;
  recency: number;
  significance: number;
};

export type TrendingScoreResult = {
  components: TrendingScoreComponents;
  score: number;
};

export type RecommendationProfile = {
  affinities: {
    categorySegments: Record<string, TimeWeightedScore>;
    tagTokens: Record<string, TimeWeightedScore>;
  };
  schemaVersion: RecommendationProfileVersion;
  stats: {
    lastSignalAtMs: number | null;
    signalCount: number;
  };
};

// ============ Signal Types =================================================== //

export const SignalKind = {
  CATEGORY_VIEWED: 'categoryViewed',
  ITEM_BOOKMARKED: 'itemBookmarked',
  ITEM_COMMITTED: 'itemCommitted',
  ITEM_UNBOOKMARKED: 'itemUnbookmarked',
  ITEM_VIEWED: 'itemViewed',
} as const;

export type SignalKind = (typeof SignalKind)[keyof typeof SignalKind];

export type CategoryViewedSignal = {
  categoryPath: readonly string[];
  kind: typeof SignalKind.CATEGORY_VIEWED;
  occurredAtMs: number;
};

export type ItemBookmarkedSignal<T> = {
  item: T;
  kind: typeof SignalKind.ITEM_BOOKMARKED;
  occurredAtMs: number;
};

export type ItemCommittedSignal<T> = {
  item: T;
  kind: typeof SignalKind.ITEM_COMMITTED;
  magnitude: number | undefined;
  occurredAtMs: number;
};

export type ItemUnbookmarkedSignal<T> = {
  item: T;
  kind: typeof SignalKind.ITEM_UNBOOKMARKED;
  occurredAtMs: number;
};

export type ItemViewedSignal<T> = {
  dwellMs: number | undefined;
  item: T;
  kind: typeof SignalKind.ITEM_VIEWED;
  occurredAtMs: number;
};

export type ItemSignal<T> = ItemBookmarkedSignal<T> | ItemCommittedSignal<T> | ItemUnbookmarkedSignal<T> | ItemViewedSignal<T>;

export type RecommendationSignal<T> = CategoryViewedSignal | ItemSignal<T>;

// ============ Tuning Types =================================================== //

/**
 * Weights for the two feature types used in affinity scoring.
 *
 * Categories are broad topics (sports, crypto). Tags are specific entities (celtics, btc).
 * Higher weight = that feature type has more influence.
 */
export type RecommendationFeatureWeights = {
  /** Weight applied to category-based affinity. */
  categorySegment: number;
  /** Weight applied to tag-based affinity. */
  tagToken: number;
};

/**
 * How much each signal type contributes to affinity scores.
 *
 * Values are additive deltas applied to the profile when a signal is recorded.
 * Positive values increase affinity, negative values decrease it.
 */
export type RecommendationSignalWeights = {
  /** Browsing a category page (no specific item). */
  categoryViewed: RecommendationFeatureWeights;
  /** Adding an item to favorites. */
  itemBookmarked: RecommendationFeatureWeights;
  /** High-value action (bet placed, purchase made). */
  itemCommitted: RecommendationFeatureWeights;
  /** Removing an item from favorites. */
  itemUnbookmarked: RecommendationFeatureWeights;
  /** Opening an item's detail view. */
  itemViewed: RecommendationFeatureWeights;
};

/**
 * Controls how user preferences are stored and decay over time.
 */
export type RecommendationAffinityTuning = {
  /**
   * Time until an affinity score decays to 50% of its value.
   *
   * Models the natural fading of interests. Shorter = recent activity dominates.
   * Longer = historical preferences persist.
   *
   * Formula: `decayedScore = score × 0.5^(elapsed / halfLife)`
   */
  decayHalfLifeMs: {
    categorySegment: number;
    tagToken: number;
  };

  /**
   * Maximum stored entries per feature type.
   *
   * When exceeded, lowest-scored entries are pruned. Bounds memory usage.
   */
  maxEntries: {
    categorySegment: number;
    tagToken: number;
  };

  /**
   * Ceiling for accumulated affinity scores.
   *
   * Prevents runaway scores from repeated signals on the same item/category.
   */
  maxScore: {
    categorySegment: number;
    tagToken: number;
  };

  /**
   * Floor below which entries are pruned.
   *
   * After decay, entries below this threshold are removed to save memory.
   */
  minRetainedScore: number;
};

/**
 * Controls how user actions are converted into profile updates.
 */
export type RecommendationSignalTuning = {
  /**
   * Amplifies commitment signals based on their magnitude (e.g., bet size).
   *
   * Larger commitments indicate stronger preference. Uses logarithmic scaling.
   */
  commitmentMagnitudeBoost: {
    /** Magnitude at which maximum boost is reached. */
    fullBoostThreshold: number;
    /** Maximum multiplier applied to signal weight. */
    maxMultiplier: number;
  };

  /**
   * Amplifies view signals based on dwell time.
   *
   * Longer views indicate genuine interest vs accidental taps.
   */
  viewDurationBoost: {
    /** Dwell time at which maximum boost is reached. */
    fullBoostThresholdMs: number;
    /** Maximum multiplier applied to signal weight. */
    maxMultiplier: number;
  };

  /** Base weights for each signal type. */
  weights: RecommendationSignalWeights;
};

/**
 * Controls result diversity to avoid clustering around the same topics.
 */
export type RecommendationDiversificationTuning = {
  /**
   * How much user affinity reduces the diversity penalty. Range: [0, 1].
   *
   * Users who love a category shouldn't have it over-penalized.
   *
   * Formula: `effectiveDecay = baseDecay × (1 - affinity × reduction)`
   *
   * - 0 = same penalty regardless of affinity
   * - 1 = no penalty for categories user loves
   */
  affinityDecayReduction: number;

  /**
   * Penalty per same-category item already selected.
   *
   * Formula: `penalty = 1 / (1 + count × decay)`
   *
   * | decay | 2nd item | 3rd item |
   * |-------|----------|----------|
   * | 0.3   | 77%      | 63%      |
   * | 0.5   | 67%      | 50%      |
   * | 1.0   | 50%      | 33%      |
   */
  categoryDecay: number;

  /** Whether diversification is applied. Set false for pure relevance ordering. */
  enabled: boolean;

  /** Penalty per same-tag item already selected. Same formula as categoryDecay. */
  tagDecay: number;
};

/**
 * Controls how items are scored and ranked.
 */
export type RecommendationScoringTuning = {
  /**
   * Compression factor for base relevance normalization.
   *
   * Raw relevance (e.g., volume in millions) is compressed to [0,1].
   * Higher = more spread (less compression). Lower = tighter clustering.
   *
   * Formula: `normalized = tanh(log1p(raw) / saturation)`
   */
  baseRelevanceSaturation: number;

  /**
   * Tag affinity at which category contribution reaches half strength.
   *
   * Category affinity is gated by tag strength to prevent broad category matches
   * from compensating for weak tag matches. A user who likes "movies" (tag) in
   * "pop-culture" (category) shouldn't get boosted for all pop-culture content.
   *
   * Formula: `categoryContrib × (tagAffinity / (tagAffinity + gating))`
   *
   * | gating | Tag for 50% category | Tag for 75% category |
   * |--------|----------------------|----------------------|
   * | 1.0    | 1.0                  | 3.0                  |
   * | 2.0    | 2.0                  | 6.0                  |
   */
  categoryGating: number;

  /**
   * Compression factor for affinity score normalization.
   *
   * Higher = affinity grows more linearly before saturating.
   * Typical accumulated affinity ranges 0-30.
   */
  personalAffinitySaturation: number;

  /**
   * Maximum multiplier from personal affinity at full personalization.
   *
   * Final boost = `1 + (normalizedAffinity × personalizationStrength × ceiling)`
   *
   * | ceiling | Max boost | Effect                     |
   * |---------|-----------|----------------------------|
   * | 1.5     | 2.5×      | Subtle personalization     |
   * | 2.5     | 3.5×      | Balanced (default)         |
   * | 4.0     | 5.0×      | Aggressive personalization |
   */
  personalBoostCeiling: number;

  /**
   * Overall personalization level. Range: [0, 1].
   *
   * Controls the blend between personalized and trending/objective ranking.
   * Acts as a multiplier on the signal-derived personalization strength.
   *
   * | value | Behavior |
   * |-------|----------|
   * | 0     | Pure trending (profile ignored) |
   * | 0.5   | Balanced (half personalized, half trending) |
   * | 1.0   | Fully personalized (default) |
   */
  personalization: number;

  /**
   * Signals needed to reach 63% of max personalization strength.
   *
   * Controls how quickly personalization ramps up from cold start.
   *
   * Formula: `strength = personalization × (1 - e^(-signalCount / rampUpSignals))`
   */
  personalizationRampUpSignals: number;

  /** Relative importance of category vs tag affinity in scoring. */
  weights: RecommendationFeatureWeights;
};

/**
 * Complete tuning configuration for the recommendation system.
 *
 * Use `createRecommendationTuning()` to create custom configurations
 * with partial overrides of the defaults.
 */
export type RecommendationTuning = {
  /** How preferences are stored and decay over time. */
  affinity: RecommendationAffinityTuning;
  /** How results are mixed to avoid repetition. */
  diversification: RecommendationDiversificationTuning;
  /** How items are scored and ranked. */
  scoring: RecommendationScoringTuning;
  /** How user actions update the profile. */
  signals: RecommendationSignalTuning;
};

// ============ Output Types =================================================== //

export type RecommendationScoreComponents = {
  baseRelevance: number;
  coldStartBoost: number;
  personalBoost: number;
  timelinessBoost: number;
};

export type RecommendationScoredItem<T> = {
  id: string;
  item: T;
  score: number;
  scoreComponents: RecommendationScoreComponents;
};
