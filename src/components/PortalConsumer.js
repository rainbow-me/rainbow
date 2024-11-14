import React, { useEffect } from 'react';
import { LoadingOverlay } from './modal';
import { useWallets } from '@/hooks';
import { sheetVerticalOffset } from '@/navigation/effects';
import { portalStore } from '@/state/portal/portal';

export default function PortalConsumer() {
  const { isWalletLoading } = useWallets();

  useEffect(() => {
    if (isWalletLoading) {
      portalStore.getState().setComponent(<LoadingOverlay paddingTop={sheetVerticalOffset} title={isWalletLoading} />, true);
    }
    return portalStore.getState().hide;
  }, [isWalletLoading]);

  return null;
}
