import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type PolymarketRoute as PolymarketRouteName } from '@/navigation/types';

export const {
  Navigation: PolymarketNavigation,
  Pager: PolymarketPager,
  Route: PolymarketRoute,
  useNavigationStore: usePolymarketNavigationStore,
} = createVirtualNavigator<PolymarketRouteName>({
  initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
  routes: [Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, Routes.POLYMARKET_ACCOUNT_SCREEN, Routes.POLYMARKET_SEARCH_SCREEN],
});
