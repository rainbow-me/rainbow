import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { useNavigation } from '@/navigation';
import { NavigateArgs } from '@/navigation/Navigation';
import { Route } from '@/navigation/routesNames';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { watchingAlert } from '@/utils';

export default function useNavigationForNonReadOnlyWallets() {
  const { goBack, navigate } = useNavigation();

  return useCallback(
    <RouteName extends Route>(...navigateArgs: NavigateArgs<RouteName>) => {
      if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      InteractionManager.runAfterInteractions(goBack);
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => navigate(...navigateArgs), 50);
      });
    },
    [goBack, navigate]
  );
}
