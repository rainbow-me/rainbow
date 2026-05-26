import { CATEGORIES, DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { device } from '@/storage';

export function navigateToPolymarket(params?: RootStackParamList[typeof Routes.POLYMARKET_NAVIGATOR]) {
  navigateToPolymarketSection(params);
}

export function navigateToPolymarketEvent(params: RootStackParamList[typeof Routes.POLYMARKET_EVENT_SCREEN]) {
  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, params);
}

export function navigateToPolymarketCategory(tagId: string): void {
  usePolymarketCategoryStore.getState().setTagId(tagId);
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(DEFAULT_SPORTS_LEAGUE_KEY);

  navigateToPolymarket();
}

export function navigateToPolymarketSportsLeague(leagueId: string): void {
  const sportsTagId = CATEGORIES.sports.tagId;
  if (!sportsTagId) return;

  usePolymarketCategoryStore.getState().setTagId(sportsTagId);
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(leagueId);
  navigateToPolymarket();
}

function navigateToPolymarketSection(params?: RootStackParamList[typeof Routes.POLYMARKET_NAVIGATOR]) {
  const hasSeenExplainSheet = device.get(['hasSeenPolymarketExplainSheet']);

  if (!hasSeenExplainSheet) {
    Navigation.handleAction(Routes.POLYMARKET_EXPLAIN_SHEET, {
      onDismiss: () => {
        device.set(['hasSeenPolymarketExplainSheet'], true);
        Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR, params);
      },
    });
  } else {
    Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR, params);
  }
}
