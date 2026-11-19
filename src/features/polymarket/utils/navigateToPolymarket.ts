import { CATEGORIES, type CategoryKey } from '@/features/polymarket/constants';
import { PolymarketNavigation } from '@/features/polymarket/navigation/polymarketNavigation';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type PolymarketRoute, type RootStackParamList } from '@/navigation/types';
import { device } from '@/storage';

export function navigateToPolymarket() {
  navigateToPolymarketSection();
}

export function navigateToPolymarketEvent(params: RootStackParamList[typeof Routes.POLYMARKET_EVENT_SCREEN]) {
  Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, params);
}

/** Opens a Predictions category; unknown tags open the navigator without changing its category. */
export function navigateToPolymarketCategory(tagId: string): void {
  if (!isCategoryKey(tagId)) return navigateToPolymarket();

  usePolymarketCategoryStore.getState().setTagId(tagId);

  navigateToPolymarketSection(Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);
}

/** Opens a Sports scope in the Predictions browse tab. */
export function navigateToPolymarketSportsLeague(scopeId: string): void {
  sportsNavigationStores.predictions.getState().select(scopeId);
  usePolymarketCategoryStore.getState().setTagId('sports');
  navigateToPolymarketSection(Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);
}

/** Opens the Predictions navigator on the Portfolio tab. */
export function navigateToPolymarketPortfolio(): void {
  navigateToPolymarketSection(Routes.POLYMARKET_ACCOUNT_SCREEN);
}

function isCategoryKey(tagId: string): tagId is CategoryKey {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, tagId);
}

let scrollBrowseToTopKey = 0;

function navigateToPolymarketSection(route?: PolymarketRoute) {
  const openNavigator = () => {
    if (!route) return Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR);

    // Selecting the tab before the navigator mounts lets its pager start there instead of sliding over from Browse.
    PolymarketNavigation.resetNavigationState();
    PolymarketNavigation.navigate(route);
    scrollBrowseToTopKey += 1;
    Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR, { scrollBrowseToTopKey });
  };

  const hasSeenExplainSheet = device.get(['hasSeenPolymarketExplainSheet']);

  if (!hasSeenExplainSheet) {
    Navigation.handleAction(Routes.POLYMARKET_EXPLAIN_SHEET, {
      onDismiss: () => {
        device.set(['hasSeenPolymarketExplainSheet'], true);
        openNavigator();
      },
    });
  } else {
    openNavigator();
  }
}
