import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import { Button } from '../buttons';
import { useWalletConnectConnections } from '@/hooks';
import { pair as pairWalletConnect } from '@/walletConnect';
import { parseUri } from '@walletconnect/utils';

export default function EmulatorPasteUriButton() {
  const { result: isEmulator } = useIsEmulator();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  const { colors } = useTheme();

  const handlePastedUri = useCallback(
    uri => {
      const { version } = parseUri(uri);
      if (version === 1) {
        walletConnectOnSessionRequest(uri);
      } else if (version === 2) {
        pairWalletConnect({ uri });
      }
    },
    [pairWalletConnect, walletConnectOnSessionRequest]
  );

  const handlePressPasteSessionUri = useCallback(() => {
    Alert.prompt(
      lang.t('walletconnect.paste_uri.title'),
      lang.t('walletconnect.paste_uri.message'),
      [{ onPress: handlePastedUri, text: lang.t('button.confirm') }],
      'plain-text'
    );
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
