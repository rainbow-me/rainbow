import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import { Button } from '../buttons';
import { pair as pairWalletConnect } from '@/walletConnect';
import { parseUri } from '@walletconnect/utils';

export default function EmulatorPasteUriButton() {
  const { result: isEmulator } = useIsEmulator();
  const { colors } = useTheme();

  const handlePastedUri = useCallback(
    uri => {
      const { version } = parseUri(uri);
      if (version === 2) {
        pairWalletConnect({ uri });
      }
    },
    [pairWalletConnect]
  );

  const handlePressPasteSessionUri = useCallback(() => {
    Alert.prompt(
      i18n.t(i18n.l.walletconnect.paste_uri.title),
      i18n.t(i18n.l.walletconnect.paste_uri.message),
      [{ onPress: handlePastedUri, text: i18n.t(i18n.l.button.confirm) }],
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
      {i18n.t(i18n.l.walletconnect.paste_uri.button)}
    </Button>
  ) : null;
}
