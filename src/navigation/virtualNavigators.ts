import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import { PolymarketNavigation } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import { type VirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes, { type Route } from '@/navigation/routesNames';
import { deepFreeze } from '@/utils/deepFreeze';

type VirtualNavigators = Readonly<{
  [key in Route]?: Pick<VirtualNavigator<Route>, 'getActiveRoute' | 'getActiveRouteState'>;
}>;

export const VIRTUAL_NAVIGATORS = deepFreeze<VirtualNavigators>({
  [Routes.PERPS_NAVIGATOR]: PerpsNavigation,
  [Routes.POLYMARKET_NAVIGATOR]: PolymarketNavigation,
});
