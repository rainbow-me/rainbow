import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const Overlay = styled(Centered)`
  top: 30;
  width: 100%;
  height: 100;
  justify-content: center;
  align-items: center;
`;

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 100,
  blurType: isDarkMode ? 'light' : 'ultraThinMaterialDark',
  reducedTransparencyFallbackColor: 'black',
}))`
  width: 260;
  height: 50;
  border-radius: 25;
  padding-top: 10;
`;

function ConnectedDapps() {
  const { walletConnectorsByDappName } = useWalletConnectConnections();
  const { navigate } = useNavigation();

  return walletConnectorsByDappName.length === 0 ? null : (
    <Overlay>
      <ButtonPressAnimation
        onPress={() => navigate(Routes.CONNECTED_DAPPS)}
        scaleTo={0.9}
      >
        <View>
          <OverlayBlur>
            <Text align="center" color="whiteLabel" size="large" weight="bold">
              ️‍🌈 {walletConnectorsByDappName.length} app
              {walletConnectorsByDappName.length === 1 ? '' : 's'} connected 􀯼
            </Text>
          </OverlayBlur>
        </View>
      </ButtonPressAnimation>
    </Overlay>
  );
}

export default ConnectedDapps;
