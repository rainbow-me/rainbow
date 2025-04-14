import { useCallback } from 'react';
import { InteractionManager } from 'react-native';

import { useWalletsStore } from '@/state/wallets/walletsStore';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { useNavigation } from '@/navigation';
import { watchingAlert } from '@/utils';

export default function useNavigationForNonReadOnlyWallets() {
  const { goBack, navigate } = useNavigation();
  const isReadOnlyWallet = useWalletsStore(state => state.getIsReadOnlyWallet());

  return useCallback(
    (routeName: string, params?: any) => {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      InteractionManager.runAfterInteractions(goBack);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => navigate(routeName, params), 50);
      });
    },
    [goBack, isReadOnlyWallet, navigate]
  );
}
