import React, { useCallback } from 'react';
import { useIsEmulator } from 'react-native-device-info';
import { Prompt } from '../alerts';
import { Button } from '../buttons';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWalletConnectConnections } from '@rainbow-me/hooks';

export default function EmulatorPasteUriButton() {
  const { result: isEmulator } = useIsEmulator();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const handlePastedUri = useCallback(
    async uri => walletConnectOnSessionRequest(uri),
    [walletConnectOnSessionRequest]
  );

  const handlePressPasteSessionUri = useCallback(() => {
    Prompt({
      callback: handlePastedUri,
      message: 'Paste WalletConnect URI below',
      title: 'New WalletConnect Session',
      type: 'plain-text',
    });
  }, [handlePastedUri]);

  return isEmulator ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Button
      backgroundColor={colors.white}
      color={colors.sendScreen.brightBlue}
      onPress={handlePressPasteSessionUri}
      size="small"
      type="pill"
    >
      Paste session URI
    </Button>
  ) : null;
}
