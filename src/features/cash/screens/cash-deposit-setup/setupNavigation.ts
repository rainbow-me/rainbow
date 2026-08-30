import { goBack, navigate } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { getNextSetupStep, isSetupEditDetour } from './steps';

export function completeSetupStep(): void {
  const { activeRoute, history } = useCashDepositSetupNavigationStore.getState();
  if (isSetupEditDetour(activeRoute, history.at(-1))) {
    CashDepositSetupNavigation.goBack();
    return;
  }

  const nextRoute = getNextSetupStep(activeRoute);
  if (nextRoute) {
    CashDepositSetupNavigation.navigate(nextRoute);
    return;
  }

  completeSetup();
}

export function completeSetup(): void {
  goBack();
  navigate(Routes.ADD_CASH_SHEET);
}

export function cancelSetup(): void {
  const hasPasskey = useCashAccountStore.getState().userId != null;
  const { status } = useCashSetupSessionStore.getState().session;
  if (!hasPasskey && (status === 'phoneSubmitted' || status === 'recovery' || status === 'phoneVerified')) {
    navigate(Routes.CASH_SETUP_CANCEL_SHEET);
  } else {
    goBack();
  }
}

export function goBackInSetup(): void {
  if (useCashDepositSetupNavigationStore.getState().history.length) CashDepositSetupNavigation.goBack();
  else cancelSetup();
}
