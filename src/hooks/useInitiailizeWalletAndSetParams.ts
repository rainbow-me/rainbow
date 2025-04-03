import { useInitializeWallet } from '@/hooks';
import { useNavigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

enum WalletLoadingStates {
  IDLE = 0,
  INITIALIZING = 1,
  INITIALIZED = 2,
}

export const useInitializeWalletAndSetParams = () => {
  const { params } = useRoute<RouteProp<RootStackParamList, 'WalletScreen'>>();

  const { setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();

  const walletState = useRef(WalletLoadingStates.IDLE);

  useEffect(() => {
    const initializeAndSetParams = async () => {
      walletState.current = WalletLoadingStates.INITIALIZING;
      // @ts-expect-error messed up initializeWallet types
      await initializeWallet(null, null, null, !params?.emptyWallet);
      walletState.current = WalletLoadingStates.INITIALIZED;
      setParams({ emptyWallet: false });
    };

    if (
      walletState.current !== WalletLoadingStates.INITIALIZING &&
      (walletState.current !== WalletLoadingStates.INITIALIZED ||
        (params?.emptyWallet && walletState.current === WalletLoadingStates.INITIALIZED))
    ) {
      // We run the migrations only once on app launch
      initializeAndSetParams();
    }
  }, [initializeWallet, params, setParams]);
};
