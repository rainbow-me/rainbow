import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type PerpsRoute as PerpsRouteName } from '@/navigation/types';

export const {
  Navigation: PerpsNavigation,
  Pager: PerpsPager,
  Route: PerpsRoute,
  useNavigationStore: usePerpsNavigationStore,
} = createVirtualNavigator<PerpsRouteName>({
  initialRoute: Routes.PERPS_ACCOUNT_SCREEN,
  routes: [Routes.PERPS_ACCOUNT_SCREEN, Routes.PERPS_SEARCH_SCREEN, Routes.PERPS_NEW_POSITION_SCREEN],
});
