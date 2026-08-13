import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { useCashDepositSetupStatusStore } from '../../stores/cashDepositSetupStore';
import { getFirstSetupStep, SETUP_STEP_GROUP, SETUP_STEP_ORDER } from './steps';

const Navigator = createVirtualNavigator<CashDepositSetupRoute>({
  initialRoute: SETUP_STEP_ORDER[0],
  routes: [...SETUP_STEP_ORDER],
  options: {
    getEntryRoute: () => getFirstSetupStep(useCashDepositSetupStatusStore.getState()) ?? SETUP_STEP_ORDER[0],
    getRouteGroup: route => SETUP_STEP_GROUP[route],
  },
});

export const CashDepositSetupNavigator = Navigator;
export const CashDepositSetupNavigation = Navigator.Navigation;
export const useCashDepositSetupNavigationStore = Navigator.useNavigationStore;
