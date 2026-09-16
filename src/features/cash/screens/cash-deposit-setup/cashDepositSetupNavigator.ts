import { createVirtualNavigator } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { useCashDepositSetupStatusStore } from '../../stores/cashDepositSetupStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { getFirstSetupStep, SETUP_STEP_GROUP, SETUP_STEP_ORDER } from './steps';

function getEntryRoute(): CashDepositSetupRoute {
  const status = useCashDepositSetupStatusStore.getState();
  const sessionStore = useCashSetupSessionStore.getState();
  if (status === 'needsIdentity' && selectIsPhoneVerified(sessionStore)) {
    return sessionStore.getIdentity() && sessionStore.getGovernmentId() ? Routes.CASH_SETUP_REVIEW : Routes.CASH_SETUP_IDENTITY;
  }
  return getFirstSetupStep(status) ?? SETUP_STEP_ORDER[0];
}

const Navigator = createVirtualNavigator<CashDepositSetupRoute>({
  initialRoute: SETUP_STEP_ORDER[0],
  routes: [...SETUP_STEP_ORDER],
  options: {
    getEntryRoute,
    getRouteGroup: route => SETUP_STEP_GROUP[route],
  },
});

export const CashDepositSetupNavigator = Navigator;
export const CashDepositSetupNavigation = Navigator.Navigation;
export const useCashDepositSetupNavigationStore = Navigator.useNavigationStore;
