import React, { useState } from 'react';
import { View } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import Animated, { useCode } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { BubbleSheet } from '../components/bubble-sheet';
import { Button } from '../components/buttons';
import { DiscoverSheet } from '../components/discover-sheet';
import { BackButton, Header, HeaderHeight } from '../components/header';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import {
  WalletConnectExplainer,
  WalletConnectList,
} from '../components/walletconnect-list';
import useExperimentalFlag, {
  DISCOVER_SHEET,
} from '../config/experimentalHooks';
import { scrollPosition } from '../navigation/helpers';
import { colors, position } from '../styles';
import { magicMemo } from '../utils';

const DimmedView = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

const Background = styled.View`
  background-color: black;
  height: 100%;
  position: absolute;
  width: 100%;
`;

const { greaterThan, onChange, call } = Animated;

const Dim = ({ children }) => (
  <DimmedView
    style={{ opacity: Animated.min(Animated.sub(scrollPosition, 1), 0.9) }}
  >
    {children}
  </DimmedView>
);

const ENABLING_CAMERA_OFFSET = 1.01;

const QRScannerScreen = ({
  enableScanning,
  isCameraAuthorized,
  onPressBackButton,
  onPressPasteSessionUri,
  onScanSuccess,
  onSheetLayout,
  sheetHeight,
  walletConnectorsByDappName,
  walletConnectorsCount,
  ...props
}) => {
  const { result: isEmulator } = useIsEmulator();
  const insets = useSafeArea();
  const discoverSheetAvailable = useExperimentalFlag(DISCOVER_SHEET);
  const [isFocused, setIsFocused] = useState(false);
  useCode(
    () =>
      onChange(
        greaterThan(scrollPosition, ENABLING_CAMERA_OFFSET),
        call([scrollPosition], ([pos]) =>
          setIsFocused(pos > ENABLING_CAMERA_OFFSET)
        )
      ),
    []
  );

  return (
    <View>
      {discoverSheetAvailable ? <DiscoverSheet /> : null}
      <Centered
        {...position.sizeAsObject('100%')}
        backgroundColor={colors.appleBlue}
        direction="column"
        overflow="hidden"
      >
        <Background />
        <Dim>
          <QRCodeScanner
            {...props}
            contentPositionBottom={sheetHeight}
            contentPositionTop={HeaderHeight}
            enableCamera={isFocused}
            enableScanning={enableScanning}
            isCameraAuthorized={isCameraAuthorized}
            isEmulator={isEmulator}
            onSuccess={onScanSuccess}
            showCrosshairText={!!walletConnectorsCount}
          />
        </Dim>
        {discoverSheetAvailable ? null : (
          <BubbleSheet bottom={insets.bottom ? 21 : 0} onLayout={onSheetLayout}>
            {walletConnectorsCount ? (
              <WalletConnectList items={walletConnectorsByDappName} />
            ) : (
              <WalletConnectExplainer />
            )}
          </BubbleSheet>
        )}
        <Header justify="space-between" position="absolute" top={0}>
          <BackButton
            testID="goToBalancesFromScanner"
            color={colors.white}
            direction="left"
            onPress={onPressBackButton}
          />
          {isEmulator && (
            <Button
              backgroundColor={colors.white}
              color={colors.sendScreen.brightBlue}
              onPress={onPressPasteSessionUri}
              size="small"
              type="pill"
            >
              Paste session URI
            </Button>
          )}
        </Header>
      </Centered>
    </View>
  );
};

export default magicMemo(QRScannerScreen, [
  'enableScanning',
  'isCameraAuthorized',
  'modalVisible',
  'sheetHeight',
  'walletConnectorsCount',
]);
