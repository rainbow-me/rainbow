import PropTypes from 'prop-types';
import React from 'react';
import DeviceInfo from 'react-native-device-info';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import BottomSheet from 'reanimated-bottom-sheet';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated'
import RadialGradient from 'react-native-radial-gradient';
import { Transition } from 'react-navigation-fluid-transitions';
import { BubbleSheet } from '../components/bubble-sheet';
import { Button } from '../components/buttons';
import { BackButton, Header } from '../components/header';
import { Centered, Row } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { colors, padding, position } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import Flex from '../components/layout/Flex';
import Text from '../components/text/Text';
import SimulatorFakeCameraImageSource from '../assets/simulator-fake-camera-image.jpg';
import Divider from '../components/Divider';
import { H1 } from '../components/text';
import Column from '../components/layout/Column';
import { ButtonPressAnimation } from '../components/animations';
import { Icon } from '../components/icons';
import { Input } from '../components/inputs';


const { onChange, eq, call, cond } = Animated;

const Container = styled(Centered)`
  ${position.size('100%')};
  background-color: ${colors.black};
  overflow: hidden;
`;

const QRScannerScreenHeader = styled(Header).attrs({
  justify: 'space-between',
})`
  position: absolute;
  top: 0;
`;
const BubbleSheetBorderRadius = 30;

const BottomSheetContainer = styled(Flex)`
  ${padding(0, 19)};
  flex-direction: column;
  background-color: ${colors.white};
  border-top-right-radius: ${BubbleSheetBorderRadius};
  border-top-left-radius: ${BubbleSheetBorderRadius};
  overflow: visible;
`;

const RowContainer = styled(Row)`
  justify-content: space-between;
  width: 100%;
  margin-vertical: 8px;
`;

const RoundedWrapper = styled(Flex)`
  border-radius: 16px;
  overflow: hidden;
  margin-right: 12px;
`;

const MarginedHeader = styled(H1)`
  margin-top: 25px;
  marginBottom: 4px;
`;

const MarginedDescText = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.45),
  size: 'large',
})`
  margin-bottom: 22px;
  margin-top: 4px;
`;

const InvestmentsGradient = styled(RadialGradient).attrs({
  center: [0, 90],
  css: position.cover,
})`
  height: 105px
  width: 140px;
  borderRadius: 16px;
  position: relative;
  justifyContent: center;
  alignItems: center;
`;

const SearchInput = styled(Input)`
  backgroundColor: ${colors.inputGrey};
  height: 40px;
  borderRadius: 20px;
`;

// It's vital for good transition to have the same ratio as screen
const forYouBadgeWidth = deviceUtils.dimensions.width / 2 - 26;
const forYouBadgeHeight = forYouBadgeWidth * (deviceUtils.dimensions.height / deviceUtils.dimensions.width);


const ForYouBadge = styled(FastImage)`
  position: relative;
  overflow: hidden;
  height: ${forYouBadgeHeight};
  width: ${forYouBadgeWidth};
`;

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  align-self: center;
  margin-top: 8px;
  margin-bottom: 12px;
`;
const QRScannerScreen = ({
  bottomSheetCallbackNode,
  enableScanning,
  isCameraAuthorized,
  isFocused,
  navigation,
  onChangeExpandedBottomSheet,
  onPressBackButton,
  onPressPasteSessionUri,
  onScanSuccess,
  onSheetLayout,
  sheetHeight,
  walletConnectorsByDappName,
  walletConnectorsCount,
  ...props
}) => (
  <Container direction="column">
    <Animated.Code exec={onChange(eq(0, bottomSheetCallbackNode), call([bottomSheetCallbackNode], onChangeExpandedBottomSheet))}/>
    <BottomSheet
      callbackNode={bottomSheetCallbackNode}
      snapPoints = {['100%', 100]}
      initialSnap={1}
      renderContent = {() => (
        <BottomSheetContainer>
          <HandleIcon/>
          <SearchInput/>
          <MarginedHeader size="large" weight="semibold">
            Investments
          </MarginedHeader>
          <MarginedDescText>
            💰Ways to earn and grow your money
          </MarginedDescText>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{
              overflow: 'visible',
            }}
          >
            <RowContainer>
              {Array.from(Array(50), (e, i) => (
                <RoundedWrapper>
                  <InvestmentsGradient
                    key={i}
                    colors={[colors.primaryBlue, '#006FFF']}
                  >
                    <Text>
                      sample
                    </Text>
                  </InvestmentsGradient>
                </RoundedWrapper>
              ))}
            </RowContainer>
          </ScrollView>
          <Divider />
          <MarginedHeader size="large" weight="semibold">
            For You
          </MarginedHeader>
          <MarginedDescText>
            🧭 Explore the Ethereum network
          </MarginedDescText>
          <Column>
            {Array.from(Array(10), (_, i) => (
              <RowContainer key={`row${i}`}>
                {Array.from(Array(2), (_, j) => (
                  <ButtonPressAnimation
                    activeOpacity={0.5}
                    onPress={() => navigation.navigate('ForYouExpanded', { fluidTargetName: `For You${i}_${j}` })}
                    scaleTo={0.96}
                  >
                    <Transition shared={`For You${i}_${j}`}>
                      <ForYouBadge
                        key={`${i}_${j}`}
                        source={SimulatorFakeCameraImageSource}
                        style={{
                          borderRadius: 16, // it need to be here for handling animation.
                        }}
                      />
                    </Transition>
                  </ButtonPressAnimation>))}
              </RowContainer>
            ))}
          </Column>
        </BottomSheetContainer>
      )}
      renderHeader = {null}
    />
    <QRCodeScanner
      {...props}
      contentStyles={{
        bottom: sheetHeight,
        top: Header.height,
      }}
      enableCamera={isFocused}
      enableScanning={enableScanning}
      isCameraAuthorized={isCameraAuthorized}
      onSuccess={onScanSuccess}
      showCrosshairText={!!walletConnectorsCount}
    />
    <QRScannerScreenHeader>
      <BackButton
        testID="goToBalancesFromScanner"
        color={colors.white}
        direction="left"
        onPress={onPressBackButton}
      />
      {DeviceInfo.isEmulator() && (
        <Button
          backgroundColor={colors.white}
          color={colors.sendScreen.brightBlue}
          onPress={onPressPasteSessionUri}
          size="small"
          style={{ marginBottom: 10 }}
          type="pill"
        >
          Paste session URI
        </Button>
      )}
    </QRScannerScreenHeader>
    <BubbleSheet
      bottom={safeAreaInsetValues.bottom ? 21 : 0}
      onLayout={onSheetLayout}
    >
    </BubbleSheet>
  </Container>
);

QRScannerScreen.propTypes = {
  bottomSheetCallbackNode: PropTypes.object,
  enableScanning: PropTypes.bool,
  isCameraAuthorized: PropTypes.bool,
  isFocused: PropTypes.bool.isRequired,
  navigation: PropTypes.object,
  onChangeExpandedBottomSheet: PropTypes.func,
  onPressBackButton: PropTypes.func,
  onPressPasteSessionUri: PropTypes.func,
  onScanSuccess: PropTypes.func,
  onSheetLayout: PropTypes.func,
  sheetHeight: PropTypes.number,
  showSheet: PropTypes.bool,
  showWalletConnectSheet: PropTypes.bool,
  walletConnectorsByDappName: PropTypes.arrayOf(PropTypes.object),
  walletConnectorsCount: PropTypes.number,
};

QRScannerScreen.defaultProps = {
  showWalletConnectSheet: true,
};

export default onlyUpdateForKeys([
  'enableScanning',
  'isCameraAuthorized',
  'isFocused',
  'sheetHeight',
  'walletConnectorsCount',
])(QRScannerScreen);
