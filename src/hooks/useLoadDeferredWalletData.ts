import { useLoadAccountLateData, useLoadGlobalLateData } from '@/hooks';
import { AppState } from '@/redux/store';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useLoadDeferredWalletData = () => {
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);

  useEffect(() => {
    if (walletReady) {
      loadAccountLateData();
      loadGlobalLateData();
    }
  }, [loadAccountLateData, loadGlobalLateData, walletReady]);
};
