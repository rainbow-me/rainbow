import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useSelector } from 'react-redux';
import { useLoadAccountLateData, useLoadGlobalLateData } from '@/hooks';
import { AppState } from '@/redux/store';
import useMigrateShowcaseAndHidden from './useMigrateShowcaseAndHidden';

export const useLoadDeferredWalletData = () => {
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const migrateShowcaseAndHidden = useMigrateShowcaseAndHidden();

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);

  useEffect(() => {
    if (walletReady) {
      requestIdleCallback(() => {
        InteractionManager.runAfterInteractions(() => {
          loadAccountLateData().then(migrateShowcaseAndHidden);
          loadGlobalLateData();
        });
      });
    }
  }, [loadAccountLateData, loadGlobalLateData, migrateShowcaseAndHidden, walletReady]);
};
