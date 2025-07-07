import { Navigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { ReviewPromptAction } from '@/storage/schema';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import Routes from '@/navigation/routesNames';
import { initializeWallet } from '@/state/wallets/initializeWallet';

enum WalletLoadingStates {
  IDLE = 0,
  INITIALIZING = 1,
  INITIALIZED = 2,
}

export const useInitializeWalletAndSetParams = () => {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.WALLET_SCREEN>>();

  const walletState = useRef(WalletLoadingStates.IDLE);

  useEffect(() => {
    const initializeAndSetParams = async () => {
      walletState.current = WalletLoadingStates.INITIALIZING;

      const shouldCreateFirstWallet = params?.emptyWallet ?? false;

      await initializeWallet({
        shouldCreateFirstWallet,
        shouldRunMigrations: true,
      });

      walletState.current = WalletLoadingStates.INITIALIZED;
      if (shouldCreateFirstWallet) Navigation.setParams<typeof Routes.WALLET_SCREEN>({ emptyWallet: false });

      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.ViewedWalletScreen);
        });
      }, 3_000);
    };

    if (
      walletState.current !== WalletLoadingStates.INITIALIZING &&
      (walletState.current !== WalletLoadingStates.INITIALIZED ||
        (params?.emptyWallet && walletState.current === WalletLoadingStates.INITIALIZED))
    ) {
      // We run the migrations only once on app launch
      initializeAndSetParams();
    }
  }, [params]);
};
