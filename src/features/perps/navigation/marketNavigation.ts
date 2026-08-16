import { PerpsNavigation } from '@/features/perps/navigation/perpsNavigation';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarket } from '@/features/perps/types';
import { maybeNavigateToPerpsExplainSheet } from '@/features/perps/utils/navigateToPerps';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export function navigateToNewPositionScreen(market: PerpMarket) {
  void useHlNewPositionStore.getState().setMarket(market);
  PerpsNavigation.navigate(Routes.PERPS_NEW_POSITION_SCREEN);
}

export function navigateToPerpDetailScreen(symbol: string) {
  const market = hyperliquidMarketsActions.getMarket(symbol);
  if (!market) return;
  maybeNavigateToPerpsExplainSheet(() => Navigation.handleAction(Routes.PERPS_DETAIL_SCREEN, { market }));
}
