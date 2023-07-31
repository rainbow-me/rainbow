import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { useIsEmulator } from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Prompt } from '../alerts';
import { Button } from '../buttons';
import { Box } from '@/design-system';
import { useDimensions, useWalletConnectConnections } from '@/hooks';

export default function EmulatorPasteUriButton() {
  const { height: deviceHeight } = useDimensions();
  const { result: isEmulator } = useIsEmulator();
  const { top: topInset } = useSafeAreaInsets();
  const { walletConnectOnSessionRequest } = useWalletConnectConnections();
  const { colors } = useTheme();

  const handlePastedUri = useCallback(
    async uri => walletConnectOnSessionRequest(uri),
    [walletConnectOnSessionRequest]
  );

  const handlePressPasteSessionUri = useCallback(() => {
    Prompt({
      buttons: [{ onPress: handlePastedUri, text: lang.t('button.confirm') }],
      message: lang.t('walletconnect.paste_uri.message'),
      title: lang.t('walletconnect.paste_uri.title'),
      type: 'plain-text',
    });
  }, [handlePastedUri]);

  return isEmulator ? (
    <Box
      height={{ custom: deviceHeight - topInset * 1.5 }}
      justifyContent="center"
      position="absolute"
      top="0px"
      width="full"
    >
      <Button
        alignSelf="center"
        backgroundColor={colors.white}
        color={colors.sendScreen.brightBlue}
        onPress={handlePressPasteSessionUri}
        position="absolute"
        size="small"
        type="pill"
      >
        {lang.t('walletconnect.paste_uri.button')}
      </Button>
    </Box>
  ) : null;
}
