import { useCallback } from 'react';
import { InteractionManager } from 'react-native';

import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { useNavigation } from '@/navigation';
import { watchingAlert } from '@/utils';

export default function useNavigationForNonReadOnlyWallets() {
  const { goBack, navigate } = useNavigation();

  return useCallback(
    (routeName: string, params?: any) => {
      if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      InteractionManager.runAfterInteractions(goBack);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => navigate(routeName, params), 50);
      });
    },
    [goBack, navigate]
  );
}
