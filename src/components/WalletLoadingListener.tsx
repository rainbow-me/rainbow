import React, { useEffect } from 'react';
import { LoadingOverlay } from './modal';
import { sheetVerticalOffset } from '@/navigation/effects';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';

export default function WalletLoadingListener() {
  const loadingState = walletLoadingStore(state => state.loadingState);

  useEffect(() => {
    if (loadingState) {
      walletLoadingStore.getState().setComponent(<LoadingOverlay paddingTop={sheetVerticalOffset} title={loadingState} />);
    }
    return walletLoadingStore.getState().hide;
  }, [loadingState]);

  return null;
}
