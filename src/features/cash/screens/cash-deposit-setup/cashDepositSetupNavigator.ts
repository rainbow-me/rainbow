import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { SETUP_STEP_GROUP, SETUP_STEP_ORDER } from './steps';

const Navigator = createVirtualNavigator<CashDepositSetupRoute>({
  initialRoute: SETUP_STEP_ORDER[0],
  routes: [...SETUP_STEP_ORDER],
  options: {
    getRouteGroup: route => SETUP_STEP_GROUP[route],
  },
});

export const CashDepositSetupNavigator = Navigator;
export const CashDepositSetupNavigation = Navigator.Navigation;
export const useCashDepositSetupNavigationStore = Navigator.useNavigationStore;
