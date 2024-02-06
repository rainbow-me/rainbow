import lang from 'i18n-js';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { useWalletConnectConnections } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { AccentColorProvider, Box, ColorModeProvider, Inline, Inset, Text } from '@/design-system';
import { ImgixImage } from '../images';
import rainbowIconCircle from '@/assets/rainbow-icon-circle.png';
import { Source } from 'react-native-fast-image';

function ConnectedDapps() {
  const { walletConnectorsByDappName } = useWalletConnectConnections();
  const { navigate } = useNavigation();

  return walletConnectorsByDappName.length === 0 ? null : (
    <ButtonPressAnimation onPress={() => navigate(Routes.CONNECTED_DAPPS)} scaleTo={0.9}>
      {/* TODO: replace with new colors */}
      <AccentColorProvider color="rgba(245, 248, 255, 0.12)">
        <Box borderRadius={22} alignItems="center" justifyContent="center" background="accent" height={{ custom: 44 }}>
          <ColorModeProvider value="darkTinted">
            <Inset left="8px" right={{ custom: 16 }}>
              <Inline alignVertical="center" space="8px">
                <Box as={ImgixImage} source={rainbowIconCircle as Source} height={{ custom: 28 }} width={{ custom: 28 }} size={30} />
                <Text color="label" weight="bold" size="17pt">
                  {walletConnectorsByDappName.length === 1
                    ? lang.t('wallet.qr.qr_1_app_connected')
                    : lang.t('wallet.qr.qr_multiple_apps_connected', {
                        appsConnectedCount: walletConnectorsByDappName.length,
                      })}
                </Text>
              </Inline>
            </Inset>
          </ColorModeProvider>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}

export default ConnectedDapps;
