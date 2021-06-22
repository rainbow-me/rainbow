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

const LabelText = styled(Text)`
  margin-top: ${android ? 0 : -3};
  line-height: 46;
`;

const Overlay = styled(Centered)`
  align-items: center;
  height: 100;
  justify-content: center;
  top: 30;
  width: 100%;
`;

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 100,
  blurType: isDarkMode ? 'light' : android ? 'dark' : 'ultraThinMaterialDark',
}))`
  border-radius: 23;
  height: 46;
  padding-horizontal: 15;
  z-index: 1;
  justify-content: center;
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
        <View
          style={
            android
              ? {
                  borderRadius: 24,
                  height: 45,
                  marginTop: 10,
                  overflow: 'hidden',
                  width: 250,
                }
              : null
          }
        >
          <OverlayBlur>
            <LabelText
              align="center"
              color="whiteLabel"
              size="lmedium"
              weight="heavy"
            >
              ️‍🌈 {walletConnectorsByDappName.length} app
              {walletConnectorsByDappName.length === 1 ? '' : 's'} connected 􀯼
            </LabelText>
          </OverlayBlur>
        </View>
      </ButtonPressAnimation>
    </Overlay>
  );
}

export default ConnectedDapps;
