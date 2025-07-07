import { useCallback } from 'react';
import { InteractionManager } from 'react-native';

import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { Navigation } from '@/navigation';
import { watchingAlert } from '@/utils';

export default function useNavigationForNonReadOnlyWallets() {
  return useCallback((routeName: string, params?: any) => {
    if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) {
      watchingAlert();
      return;
    }

    InteractionManager.runAfterInteractions(Navigation.goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => Navigation.handleAction(routeName, params), 50);
    });
  }, []);
}
