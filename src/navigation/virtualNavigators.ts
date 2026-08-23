import { PerpsNavigation } from '@/features/perps/navigation/perpsNavigation';
import { PolymarketNavigation } from '@/features/polymarket/navigation/polymarketNavigation';
import { type VirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes, { type Route } from '@/navigation/routesNames';

type VirtualNavigators = Readonly<{
  [key in Route]?: Pick<VirtualNavigator<Route>, 'getActiveRoute' | 'getActiveRouteState'>;
}>;

export const VIRTUAL_NAVIGATORS: VirtualNavigators = Object.freeze({
  [Routes.PERPS_NAVIGATOR]: PerpsNavigation,
  [Routes.POLYMARKET_NAVIGATOR]: PolymarketNavigation,
});
