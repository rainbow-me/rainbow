import { useCallback } from 'react';

import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { useCashDepositSetupStore } from '../../stores/cashDepositSetupStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { getNextSetupStep, getSetupStep } from './steps';

export function useCashDepositSetupNavigation() {
  const { navigate, goBack: dismissScreen } = useNavigation();

  const next = useCallback(() => {
    const current = CashDepositSetupNavigation.getActiveRoute();
    const step = getSetupStep(current);
    if (step?.milestone) {
      useCashDepositSetupStore.getState().setFact(step.milestone, true);
    }

    const upcoming = getNextSetupStep(current);
    if (upcoming) {
      CashDepositSetupNavigation.navigate(upcoming);
      return;
    }

    // Linking the wallet is the last fact; it flips the derived status to `ready`.
    useCashDepositSetupStore.getState().setFact('hasLinkedWallet', true);
    dismissScreen();
    navigate(Routes.ADD_CASH_SHEET);
  }, [dismissScreen, navigate]);

  const back = useCallback(() => {
    if (useCashDepositSetupNavigationStore.getState().history.length) {
      CashDepositSetupNavigation.goBack();
    } else {
      dismissScreen();
    }
  }, [dismissScreen]);

  return { next, back };
}
