import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useLoadAccountLateData, useLoadGlobalLateData } from '@/hooks';
import { useWalletsStore } from '../state/wallets/walletsStore';

export const useLoadDeferredWalletData = () => {
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const walletReady = useWalletsStore(state => state.walletReady);

  useEffect(() => {
    if (walletReady) {
      requestIdleCallback(() => {
        InteractionManager.runAfterInteractions(() => {
          loadAccountLateData();
          loadGlobalLateData();
        });
      });
    }
  }, [loadAccountLateData, loadGlobalLateData, walletReady]);
};
