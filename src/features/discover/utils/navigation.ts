import { CATEGORIES, DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';

export function navigateToPolymarketCategory(tagId: string) {
  usePolymarketCategoryStore.getState().setTagId(tagId);

  if (tagId !== CATEGORIES.sports.tagId) {
    usePolymarketSportsEventsStore.getState().setSelectedLeagueId(DEFAULT_SPORTS_LEAGUE_KEY);
  }

  navigateToPolymarket();
}

export function navigateToPolymarketSportsLeague(leagueId: string) {
  const sportsTagId = CATEGORIES.sports.tagId;
  if (!sportsTagId) return;

  usePolymarketCategoryStore.getState().setTagId(sportsTagId);
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(leagueId);
  navigateToPolymarket();
}
