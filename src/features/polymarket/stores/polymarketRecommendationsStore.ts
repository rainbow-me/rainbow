import { Alert } from 'react-native';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { POLYMARKET_RECOMMENDATIONS_ADAPTER } from '@/systems/recommendations/adapters/polymarketRecommendations';
import { createEmptyRecommendationProfile } from '@/systems/recommendations/defaults';
import { recordCategoryView, recordItemSignal } from '@/systems/recommendations/profile';
import { Signal } from '@/systems/recommendations/signals';
import type { RecommendationProfile } from '@/systems/recommendations/types';

// ============ Types ========================================================== //

type PolymarketRecommendationsState = {
  bookmarkedEventIds: Set<string>;
  recommendationProfile: RecommendationProfile;
  addBookmark: (event: PolymarketEvent) => void;
  getProfile: () => RecommendationProfile;
  isBookmarked: (eventId: string) => boolean;
  removeBookmark: (event: PolymarketEvent) => void;
  toggleBookmark: (event: PolymarketEvent) => boolean;
  trackBet: (event: PolymarketEvent, amountUsd: number) => void;
  trackBrowse: (categorySlug: string) => void;
  trackView: (event: PolymarketEvent, dwellMs?: number) => void;
};

// ============ Store ========================================================== //

export const usePolymarketRecommendationsStore = createRainbowStore<PolymarketRecommendationsState>(
  (set, get) => ({
    bookmarkedEventIds: new Set<string>(),
    recommendationProfile: createEmptyRecommendationProfile(),

    addBookmark: event =>
      set(state => {
        if (state.bookmarkedEventIds.has(event.id)) return state;

        const newBookmarks = new Set(state.bookmarkedEventIds);
        newBookmarks.add(event.id);

        return {
          bookmarkedEventIds: newBookmarks,
          recommendationProfile: recordItemSignal({
            adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
            profile: state.recommendationProfile,
            signal: Signal.bookmarked(event),
          }),
        };
      }),

    getProfile: () => get().recommendationProfile,

    isBookmarked: eventId => get().bookmarkedEventIds.has(eventId),

    removeBookmark: event =>
      set(state => {
        if (!state.bookmarkedEventIds.has(event.id)) return state;

        const newBookmarks = new Set(state.bookmarkedEventIds);
        newBookmarks.delete(event.id);

        return {
          bookmarkedEventIds: newBookmarks,
          recommendationProfile: recordItemSignal({
            adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
            profile: state.recommendationProfile,
            signal: Signal.unbookmarked(event),
          }),
        };
      }),

    toggleBookmark: event => {
      set(state => {
        const newBookmarks = new Set(state.bookmarkedEventIds);
        const isExistingBookmark = newBookmarks.has(event.id);

        if (isExistingBookmark) newBookmarks.delete(event.id);
        else newBookmarks.add(event.id);

        return {
          bookmarkedEventIds: newBookmarks,
          recommendationProfile: recordItemSignal({
            adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
            profile: state.recommendationProfile,
            signal: isExistingBookmark ? Signal.unbookmarked(event) : Signal.bookmarked(event),
          }),
        };
      });
      return get().bookmarkedEventIds.has(event.id);
    },

    trackBet: (event, amountUsd) =>
      set(state => {
        if (amountUsd <= 0) return state;
        return {
          recommendationProfile: recordItemSignal({
            adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
            profile: state.recommendationProfile,
            signal: Signal.committed(event, { magnitude: amountUsd }),
          }),
        };
      }),

    trackBrowse: categorySlug =>
      set(state => {
        if (!categorySlug) return state;
        return {
          recommendationProfile: recordCategoryView({
            categoryPath: [categorySlug],
            profile: state.recommendationProfile,
          }),
        };
      }),

    trackView: (event, dwellMs) =>
      set(state => {
        return {
          recommendationProfile: recordItemSignal({
            adapter: POLYMARKET_RECOMMENDATIONS_ADAPTER,
            profile: state.recommendationProfile,
            signal: Signal.viewed(event, { dwellMs }),
          }),
        };
      }),
  }),

  { storageKey: 'polymarketRecommendations' }
);

// ============ Store Actions ================================================== //

export const polymarketRecommendationsActions = createStoreActions(usePolymarketRecommendationsStore);

// ============ Debug Utilities ================================================ //

export function logProfile(): void {
  Alert.alert(formatProfile(usePolymarketRecommendationsStore.getState().getProfile()));
}

export function resetRecommendations(): void {
  usePolymarketRecommendationsStore.setState({
    bookmarkedEventIds: new Set<string>(),
    recommendationProfile: createEmptyRecommendationProfile(),
  });
}

function formatRelativeTime(ms: number): string {
  const delta = Date.now() - ms;
  if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
  if (delta < 3600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86400_000) return `${Math.round(delta / 3600_000)}h ago`;
  return `${Math.round(delta / 86400_000)}d ago`;
}

function formatAffinitySection(entries: Record<string, { score: number; updatedAtMs: number }>, label: string): string {
  const sorted = Object.entries(entries).sort(([, a], [, b]) => b.score - a.score);
  if (sorted.length === 0) return '';

  const lines = sorted.map(([key, { score, updatedAtMs }]) => {
    const scoreStr = score.toFixed(2).padStart(6);
    return `  ${scoreStr}  ${key} (${formatRelativeTime(updatedAtMs)})`;
  });

  return `${label}:\n${lines.join('\n')}`;
}

export function formatProfile(profile: RecommendationProfile): string {
  const { affinities, stats } = profile;
  const sections: string[] = [];

  const catSection = formatAffinitySection(affinities.categorySegments, 'Categories');
  if (catSection) sections.push(catSection);

  const tagSection = formatAffinitySection(affinities.tagTokens, 'Tags');
  if (tagSection) sections.push(tagSection);

  const statsLine = `Stats: ${stats.signalCount} signals${stats.lastSignalAtMs ? `, last ${formatRelativeTime(stats.lastSignalAtMs)}` : ''}`;
  sections.push(statsLine);

  return sections.join('\n\n');
}
