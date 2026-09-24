import { useCallback } from 'react';

import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { useCashDepositSetupStatusStore } from '@/features/cash/stores/cashDepositSetupStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from '@/features/cash/stores/cashSetupSessionStore';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import Navigation from '@/navigation/Navigation';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';

import { useIsCashEnabled } from '../hooks/useIsCashEnabled';
import { getAddCashRoute } from './getAddCashRoute';

type AddCashRoute = ReturnType<typeof getAddCashRoute>;

export function useAddCashRoute() {
  const isCashEnabled = useIsCashEnabled();
  const setupStatus = useCashDepositSetupStatusStore();
  const isPhoneVerified = useCashSetupSessionStore(selectIsPhoneVerified);
  const route = getAddCashRoute(isCashEnabled, setupStatus, isPhoneVerified);
  const navigateToAddCash = useCallback(
    (navigate: (route: AddCashRoute) => void = route => Navigation.handleAction(route)) => {
      if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      navigate(route);
    },
    [route]
  );

  return { navigateToAddCash, isCashEnabled };
}
