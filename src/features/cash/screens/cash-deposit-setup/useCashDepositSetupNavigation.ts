import { useCallback } from 'react';

import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { useSetupCancelSheetStore } from './setupCancelSheetStore';
import { getNextSetupStep } from './steps';

export function useCashDepositSetupNavigation() {
  const { navigate, goBack: dismissScreen } = useNavigation();

  const next = useCallback(() => {
    const current = CashDepositSetupNavigation.getActiveRoute();
    const upcoming = getNextSetupStep(current);
    if (upcoming) {
      CashDepositSetupNavigation.navigate(upcoming);
      return;
    }

    dismissScreen();
    navigate(Routes.ADD_CASH_SHEET);
  }, [dismissScreen, navigate]);

  const cancel = useCallback(() => {
    const hasPasskey = useCashAccountStore.getState().userId != null;
    const { status } = useCashSetupSessionStore.getState().session;
    const hasProgressToLose = status === 'phoneSubmitted' || status === 'phoneVerified';
    if (!hasPasskey && hasProgressToLose) {
      useSetupCancelSheetStore.getState().open();
    } else {
      dismissScreen();
    }
  }, [dismissScreen]);

  const back = useCallback(() => {
    if (useCashDepositSetupNavigationStore.getState().history.length) {
      CashDepositSetupNavigation.goBack();
    } else {
      cancel();
    }
  }, [cancel]);

  return { next, back, cancel, dismiss: dismissScreen };
}
