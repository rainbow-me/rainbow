import { VirtualNavigator } from '@/navigation/createVirtualNavigator';
import { Route } from '@/navigation/routesNames';
import { deepFreeze } from '@/utils/deepFreeze';

type VirtualNavigators = Readonly<{
  [key in Route]?: Pick<VirtualNavigator<Route>, 'getActiveRoute' | 'getActiveRouteState'>;
}>;

export const VIRTUAL_NAVIGATORS = deepFreeze<VirtualNavigators>({});
