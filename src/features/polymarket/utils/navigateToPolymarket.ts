import { CATEGORIES, type CategoryKey } from '@/features/polymarket/constants';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { sportsActions } from '@/features/sports/data/sportsStore';
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
  const categoryKey = parseCategoryKey(tagId);
  if (!categoryKey) return;

  usePolymarketCategoryStore.getState().setTagId(categoryKey);

  navigateToPolymarketBrowse();
}

export function navigateToPolymarketSportsLeague(scopeId: string): void {
  sportsActions.selectDestination('predictions', scopeId === 'live' || scopeId === 'all' ? { type: scopeId } : { type: 'scope', scopeId });
  usePolymarketCategoryStore.getState().setTagId('sports');
  navigateToPolymarketBrowse();
}

// Monotonic key so a repeated deep link to the same inner route still re-triggers the
// navigator's route effect even when `initialRoute` is unchanged.
let polymarketRouteRequestKey = 0;

// Opens the Polymarket navigator on the browse tab. The inner-route intent is passed through
// the outer navigation params and applied by PolymarketNavigator, so this util never imports
// the navigator's component/store (avoiding a screen-tree dependency).
function navigateToPolymarketBrowse(): void {
  polymarketRouteRequestKey += 1;
  navigateToPolymarket({
    initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    routeRequestKey: polymarketRouteRequestKey,
  });
}

function parseCategoryKey(tagId: string): CategoryKey | undefined {
  return isCategoryKey(tagId) ? tagId : undefined;
}

function isCategoryKey(tagId: string): tagId is CategoryKey {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, tagId);
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
