import { useCallback } from 'react';

import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import { useNavigation, type NavigateArgs } from '@/navigation/Navigation';
import { type Route } from '@/navigation/routesNames';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';

export default function useNavigationForNonReadOnlyWallets() {
  const { goBack, navigate } = useNavigation();

  return useCallback(
    <RouteName extends Route>(...navigateArgs: NavigateArgs<RouteName>) => {
      if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      requestIdleCallback(goBack);
      requestIdleCallback(() => {
        setTimeout(() => navigate(...navigateArgs), 50);
      });
    },
    [goBack, navigate]
  );
}
