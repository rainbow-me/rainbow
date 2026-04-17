# Recommendation System

A domain-agnostic, on-device content recommendation engine that learns user preferences from behavioral signals and produces personalized rankings using a multiplicative scoring model.

## Overview

This system personalizes content by:

1. **Learning** user preferences from behavioral signals (views, bookmarks, commitments)
2. **Building** a compact affinity profile with exponential time-decay
3. **Ranking** items using multiplicative score composition
4. **Diversifying** results while respecting user affinities

### Key Properties

- **Domain-agnostic**: Adapter pattern supports any content type
- **Multiplicative scoring**: Personal affinity amplifies relevance rather than competing with it
- **Time-sensitive**: Timeliness boosts are preserved exactly, not absorbed by normalization
- **Affinity-aware diversification**: Users see more of what they explicitly like

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Scoring Model                                  │
│                                                                             │
│   score = baseRelevance × personalBoost × timelinessBoost × coldStartBoost  │
│                                                                             │
│   baseRelevance:    normalize(adapter.getBaseRelevance())      ∈ [0, 1]     │
│   personalBoost:    1 + affinity × strength × ceiling          ∈ [1, 3.5]   │
│   timelinessBoost:  adapter.getTimelinessBoost()               ∈ [0.7, 2.5] │
│   coldStartBoost:   fades as personalization strengthens       ∈ [0.7, 1.4] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Multiplicative?

**Additive models** (score = global + personal) have a critical flaw: personal affinity competes with global popularity. A mega-trending event can beat a live event the user explicitly cares about.

**Multiplicative models** (score = base × personal × timeliness) ensure:

- Personal affinity **amplifies** relevance
- Timeliness boosts are preserved exactly (2.5× stays 2.5×, not compressed to 1.01×)
- Low-quality items can't bubble up regardless of personalization

### File Structure

| File                        | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `types.ts`                  | Type definitions and schema version     |
| `signals.ts`                | Signal factory functions                |
| `profile.ts`                | Profile update logic                    |
| `ranking.ts`                | Multiplicative ranking algorithm        |
| `defaults.ts`               | Default tuning parameters               |
| `utils.ts`                  | Shared utilities (decay, normalization) |
| `polymarketEventAdapter.ts` | Polymarket-specific adapter             |

---

## Core Concepts

### Signals

Signals are discrete user interactions indicating preference:

| Signal         | Meaning                           | Weight          |
| -------------- | --------------------------------- | --------------- |
| `viewed`       | Opened item details               | Low positive    |
| `bookmarked`   | Saved to favorites                | Medium positive |
| `committed`    | High-value action (bet, purchase) | High positive   |
| `unbookmarked` | Removed from favorites            | Medium negative |

Optional signal metadata:

- **`dwellMs`** (viewed): Time spent viewing; longer = stronger signal
- **`magnitude`** (committed): Value indicator; larger = stronger signal

### Features

Items are characterized by two feature types:

| Feature         | Description         | Example                             |
| --------------- | ------------------- | ----------------------------------- |
| `categoryPaths` | Hierarchical paths  | `["sports", "sports/nba"]`          |
| `tagSlugs`      | Fine-grained topics | `["celtics", "lakers", "playoffs"]` |

### Affinities

The profile stores time-weighted affinity scores:

```typescript
type RecommendationProfile = {
  affinities: {
    categorySegments: Record<string, TimeWeightedScore>; // "nba" → 15.2
    tagTokens: Record<string, TimeWeightedScore>; // "celtics" → 8.4
  };
  stats: {
    signalCount: number; // Total signals recorded
    lastSignalAtMs: number; // Most recent signal timestamp
  };
};
```

Scores decay exponentially: `decayedScore = score × 0.5^(elapsed / halfLife)`

### Adapters

Adapters bridge domain-specific items to the recommendation system:

```typescript
type RecommendationItemAdapter<T> = {
  getId: (item: T) => string;
  getFeatures: (item: T) => { categoryPaths: string[]; tagSlugs: string[] };
  getBaseRelevance: (item: T) => number;
  getTimelinessBoost?: (item: T) => number; // Default: 1.0
  getColdStartBoost?: (item: T) => number; // Default: 1.0
};
```

**Separation of concerns**:

- `getBaseRelevance`: Volume, quality, engagement (normalized by the system)
- `getTimelinessBoost`: Time-sensitivity (applied multiplicatively, preserved exactly)
- `getColdStartBoost`: Category preferences for new users (fades as personalization strengthens)

---

## Scoring Algorithm

### 1. Base Relevance

Raw relevance from the adapter is normalized using log compression + tanh saturation:

```
baseRelevance = tanh(log1p(rawValue) / saturation)
```

This maps unbounded values (e.g., volume in millions) to [0, 1] with diminishing returns for extreme values.

### 2. Personal Boost

Computed from affinity matches between item features and user profile:

```
tagContrib = tagWeight × tagScore
categoryContrib = categoryWeight × categoryScore × (tagScore / (tagScore + gating))
rawAffinity = tagContrib + categoryContrib
personalBoost = 1 + tanh(rawAffinity / saturation) × personalizationStrength × ceiling
```

Category contribution is **gated by tag strength**. A user who likes "movies" (tag) in "pop-culture" (category) won't get boosted for unrelated pop-culture content like "celebrity tweets". The gating formula ensures category only amplifies when there's a tag signal to confirm relevance.

### 3. Timeliness Boost

Raw timeliness from the adapter is scaled by personalization strength and affinity:

```
effectiveWeight = (1 - personalizationStrength) + personalizationStrength × normalizedAffinity
effectiveTimeliness = 1 + (rawTimeliness - 1) × effectiveWeight
```

At low personalization (new users or `personalization < 1`), timeliness affects all items equally. At full personalization, timeliness is gated by affinity - only events you care about get the full time-sensitivity boost.

### 4. Cold-Start Boost

Category-based preferences for new users:

```
effectiveBoost = 1 + (1 - personalizationStrength) × (rawBoost - 1)
```

- New user (strength=0): Full category boost applied (e.g., sports=1.4×)
- Experienced user (strength=1): No category boost (personal affinity takes over)

### 5. Personalization Strength

Ramps up as signals accumulate:

```
strength = 1 - exp(-signalCount / rampUpSignals)
```

| Signals | Strength |
| ------- | -------- |
| 0       | 0%       |
| 6       | 39%      |
| 12      | 63%      |
| 24      | 86%      |
| 36      | 95%      |

---

## Diversification

Diversification prevents results from clustering around the same topics, but **respects user affinities**.

### Standard Diversification

Each selected item penalizes future candidates in the same category:

```
penalty = 1 / (1 + count × decay)
```

With default decay of 0.5:

- 1st item: 100% score
- 2nd item same category: 67% score
- 3rd item same category: 50% score

### Affinity-Aware Diversification

When users have explicit affinity for a category, the decay is reduced:

```
effectiveDecay = baseDecay × (1 - normalizedAffinity × affinityDecayReduction)
```

For a user with high NBA affinity (reduction=0.8):

- Effective decay: 0.5 × (1 - 0.83 × 0.8) = 0.17
- 2nd NBA item: 85% score (vs 67% without affinity awareness)
- 3rd NBA item: 75% score (vs 50% without affinity awareness)

This ensures users who love a topic see more of it, while still providing some diversity.

---

## API Reference

### Profile Management

```typescript
import { createEmptyRecommendationProfile } from '@/systems/recommendations/defaults';

const profile = createEmptyRecommendationProfile();
```

### Recording Signals

```typescript
import { recordItemSignal } from '@/systems/recommendations/profile';
import { Signal } from '@/systems/recommendations/signals';

// Record a view with dwell time
profile = recordItemSignal({
  adapter: MY_ADAPTER,
  profile,
  signal: Signal.viewed(item, { dwellMs: 15000 }),
});

// Record a bookmark
profile = recordItemSignal({
  adapter: MY_ADAPTER,
  profile,
  signal: Signal.bookmarked(item),
});

// Record a high-value commitment
profile = recordItemSignal({
  adapter: MY_ADAPTER,
  profile,
  signal: Signal.committed(item, { magnitude: 50 }),
});
```

### Ranking Items

```typescript
import { rankRecommendationItems } from '@/systems/recommendations/ranking';

const results = rankRecommendationItems({
  adapter: MY_ADAPTER,
  items: candidates,
  limit: 20,
  profile,
});

// Returns: Array<{
//   id: string;
//   item: T;
//   score: number;
//   scoreComponents: {
//     baseRelevance: number;
//     personalBoost: number;
//     timelinessBoost: number;
//     coldStartBoost: number;
//   };
// }>
```

### Extracting Top Affinities

```typescript
import { getTopAffinities } from '@/systems/recommendations/utils';

const topTags = getTopAffinities({
  featureType: 'tagTokens',
  limit: 5,
  profile,
});
// ['nba', 'celtics', 'bitcoin', ...]
```

---

## Creating Adapters

```typescript
import { RecommendationItemAdapter } from '@/systems/recommendations/types';

export const MY_ADAPTER: RecommendationItemAdapter<MyItem> = {
  getId: item => item.id,

  getFeatures: item => ({
    categoryPaths: buildCategoryPaths(item), // ['sports', 'sports/nba']
    tagSlugs: item.tags.map(t => t.slug), // ['celtics', 'playoffs']
  }),

  getBaseRelevance: item => {
    // Return raw value; system normalizes it
    const activity = item.views || item.volume;
    const quality = item.rating / 5;
    return activity * quality;
  },

  getTimelinessBoost: item => {
    if (item.isLive) return 2.5;
    if (item.startsWithinHours(2)) return 2.0;
    if (item.startsWithinHours(24)) return 1.5;
    return 1.0;
  },

  getColdStartBoost: item => {
    // Boost broadly appealing categories for new users
    const boosts: Record<string, number> = {
      sports: 1.4,
      entertainment: 1.2,
      news: 0.8,
    };
    return boosts[item.category] ?? 1.0;
  },
};
```

---

## Tuning

All tuning parameters are documented via TSDoc on `RecommendationTuning` in `types.ts`.
Use `createRecommendationTuning()` to override specific values.

### Quick Reference by Goal

| Goal                           | Parameter                              | Default  | Change                 |
| ------------------------------ | -------------------------------------- | -------- | ---------------------- |
| More/less personalized         | `scoring.personalization`              | 1        | Lower (e.g., 0.7)      |
| Category requires tag match    | `scoring.categoryGating`               | 2        | Higher (e.g., 4)       |
| Faster personalization ramp-up | `scoring.personalizationRampUpSignals` | 12       | Lower (e.g., 6)        |
| Stronger personal boost        | `scoring.personalBoostCeiling`         | 2.5      | Higher (e.g., 4.0)     |
| Longer-lasting preferences     | `affinity.decayHalfLifeMs.*`           | 30 days  | Higher (e.g., 90 days) |
| More diverse results           | `diversification.categoryDecay`        | 0.15     | Higher (e.g., 0.3)     |
| Pure relevance (no mixing)     | `diversification.enabled`              | true     | false                  |
| Stronger bookmark signal       | `signals.weights.itemBookmarked`       | {2, 1.8} | Higher values          |

### Example: Aggressive Personalization

```typescript
import { createRecommendationTuning } from '@/systems/recommendations/defaults';

const aggressiveTuning = createRecommendationTuning({
  scoring: {
    personalizationRampUpSignals: 6, // Reach full personalization faster
    personalBoostCeiling: 4.0, // Stronger boost for liked content
  },
});
```

### Example: Conservative / Editorial-Driven

```typescript
const conservativeTuning = createRecommendationTuning({
  scoring: {
    personalizationRampUpSignals: 24, // Require more evidence
    personalBoostCeiling: 1.5, // Subtle personalization
  },
  diversification: {
    categoryDecay: 0.7, // More variety in results
  },
});
```
