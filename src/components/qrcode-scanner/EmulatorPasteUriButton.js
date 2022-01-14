import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { useIsEmulator } from 'react-native-device-info';
import { Prompt } from '../alerts';
import { Button } from '../buttons';
import { useWalletConnectConnections } from '@rainbow-me/hooks';

export default function EmulatorPasteUriButton() {
  const { result: isEmulator } = useIsEmulator();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  const { colors } = useTheme();

  const handlePastedUri = useCallback(
    async uri => walletConnectOnSessionRequest(uri),
    [walletConnectOnSessionRequest]
  );

  const handlePressPasteSessionUri = useCallback(() => {
    Prompt({
      callback: handlePastedUri,
      message: lang.t('walletconnect.paste_uri.message'),
      title: lang.t('walletconnect.paste_uri.title'),
      type: 'plain-text',
    });
  }, [handlePastedUri]);

  return isEmulator ? (
    <Button
      backgroundColor={colors.white}
      color={colors.sendScreen.brightBlue}
      onPress={handlePressPasteSessionUri}
      size="small"
      type="pill"
    >
      {lang.t('walletconnect.paste_uri.button')}
    </Button>
  ) : null;
}
