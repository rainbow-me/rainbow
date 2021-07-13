import React, { useEffect } from 'react';
import { LoadingOverlay } from './modal';
import { useWallets } from '@rainbow-me/hooks';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import { usePortal } from 'react-native-cool-modals/Portal';

export default function PortalConsumer() {
  const { isWalletLoading } = useWallets();
  const { setComponent, hide } = usePortal();
  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        true
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);

  return null;
}
