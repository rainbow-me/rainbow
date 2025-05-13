import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useSelector } from 'react-redux';
import { useLoadAccountLateData, useLoadGlobalLateData } from '@/hooks';
import { AppState } from '@/redux/store';

export const useLoadDeferredWalletData = () => {
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);

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
