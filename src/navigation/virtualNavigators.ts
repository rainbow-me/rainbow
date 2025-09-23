import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import { VirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes, { Route } from '@/navigation/routesNames';
import { deepFreeze } from '@/utils/deepFreeze';

type VirtualNavigators = Readonly<{
  [key in Route]?: Pick<VirtualNavigator<Route>, 'getActiveRoute' | 'getActiveRouteState'>;
}>;

export const VIRTUAL_NAVIGATORS = deepFreeze<VirtualNavigators>({
  [Routes.PERPS_NAVIGATOR]: PerpsNavigation,
});
