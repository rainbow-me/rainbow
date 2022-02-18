import { BlurView } from '@react-native-community/blur';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';

const LabelText = styled(Text)({
  lineHeight: 46,
  marginTop: android ? 0 : -3,
});

const Overlay = styled(Centered)({
  alignItems: 'center',
  height: 100,
  justifyContent: 'center',
  top: 30,
  width: '100%',
});

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 100,
  blurType: isDarkMode ? 'light' : android ? 'dark' : 'ultraThinMaterialDark',
}))({
  borderRadius: 23,
  height: 46,
  justifyContent: 'center',
  paddingHorizontal: 15,
  zIndex: 1,
});

function ConnectedDapps() {
  const { navigate } = useNavigation();
  const {
    walletConnectorsCount,
    walletConnectV2SessionsCount,
  } = useWalletConnectConnections();

  const connectionsNumber = useMemo(
    () => walletConnectorsCount + walletConnectV2SessionsCount,
    [walletConnectorsCount, walletConnectV2SessionsCount]
  );

  return (
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
              ️‍🌈 {connectionsNumber} app
              {connectionsNumber ? '' : 's'} connected 􀯼
            </LabelText>
          </OverlayBlur>
        </View>
      </ButtonPressAnimation>
    </Overlay>
  );
}

export default ConnectedDapps;
