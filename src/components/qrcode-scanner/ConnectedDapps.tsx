import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWalletConnectConnections } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const LabelText = styled(Text)`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isDarkMode' does not exist on type 'Blur... Remove this comment to see the full error message
const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 100,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Overlay>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={() => navigate(Routes.CONNECTED_DAPPS)}
        scaleTo={0.9}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View
          style={
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <OverlayBlur>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
