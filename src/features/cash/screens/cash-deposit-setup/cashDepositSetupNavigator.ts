import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { SETUP_STEP_ORDER } from './steps';

const Navigator = createVirtualNavigator<CashDepositSetupRoute>({
  initialRoute: SETUP_STEP_ORDER[0].id,
  routes: SETUP_STEP_ORDER.map(step => step.id),
});

export const CashDepositSetupNavigator = Navigator;
export const CashDepositSetupNavigation = Navigator.Navigation;
export const useCashDepositSetupNavigationStore = Navigator.useNavigationStore;
