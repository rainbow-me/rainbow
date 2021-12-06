import React, { useEffect } from 'react';
import { LoadingOverlay } from './modal';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/effects... Remove this comment to see the full error message
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-cool-modals/Porta... Remove this comment to see the full error message
import { usePortal } from 'react-native-cool-modals/Portal';

export default function PortalConsumer() {
  const { isWalletLoading } = useWallets();
  const { setComponent, hide } = usePortal();
  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
