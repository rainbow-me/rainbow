import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View } from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { padding, position } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const Container = styled(Centered).attrs({
  flex: android ? 1 : undefined,
  self: android ? 'center' : undefined,
})`
  ${position.size('100%')};
  position: absolute;
  z-index: 999;
`;

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)};
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: ${20};
  overflow: hidden;
`;

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 40,
  blurType: isDarkMode ? 'dark' : 'light',
}))`
  ${position.cover};
  z-index: 1;
`;

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  lineHeight: ios ? 'none' : '24px',
  size: 'large',
  weight: 'semibold',
}))`
  margin-left: 8;
`;

function ConnectedDapps() {
  const { walletConnectorsCount } = useWalletConnectConnections();
  const { navigate } = useNavigation();

  return (
    <Centered
      style={{
        top: 30,
        zIndex: 10,
        width: '100%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      zIndex={2}
    >
      <ButtonPressAnimation
        onPress={() => navigate(Routes.CONNECTED_DAPPS)}
        scaleTo={0.9}
      >
        <View>
          <BlurView
            blurAmount={100}
            blurType="ultraThinMaterialDark"
            reducedTransparencyFallbackColor="black"
            style={{
              width: 260,
              height: 50,
              borderRadius: 25,
              alignSelf: 'center',
              paddingTop: 10,
            }}
          >
            <Text align="center" color="white" size="large" weight="bold">
              ️‍🌈 {walletConnectorsCount} app
              {walletConnectorsCount === 1 ? '' : 's'} connected 􀯼
            </Text>
          </BlurView>
        </View>
      </ButtonPressAnimation>
    </Centered>
  );
}

export default ConnectedDapps;
