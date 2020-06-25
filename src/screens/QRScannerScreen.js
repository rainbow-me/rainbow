import { useIsFocused } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { useIsEmulator } from 'react-native-device-info';
import { useSafeArea } from 'react-native-safe-area-context';
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
import { discoverSheetAvailable } from '../config/experimental';
import { colors, position } from '../styles';
import { isNewValueForObjectPaths } from '../utils';

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
  const isFocused = useIsFocused();

  return (
    <View>
      {discoverSheetAvailable ? <DiscoverSheet /> : null}
      <Centered
        {...position.sizeAsObject('100%')}
        backgroundColor={colors.appleBlue}
        direction="column"
        overflow="hidden"
      >
        <QRCodeScanner
          {...props}
          contentPositionBottom={sheetHeight}
          contentPositionTop={HeaderHeight}
          enableCamera={isFocused}
          enableScanning={enableScanning && isFocused}
          isCameraAuthorized={isCameraAuthorized}
          isEmulator={isEmulator}
          onSuccess={onScanSuccess}
          showCrosshairText={!!walletConnectorsCount}
        />
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

QRScannerScreen.propTypes = {
  enableScanning: PropTypes.bool,
  isCameraAuthorized: PropTypes.bool,
  isFocused: PropTypes.bool.isRequired,
  modalVisible: PropTypes.bool.isRequired,
  onPressBackButton: PropTypes.func,
  onPressPasteSessionUri: PropTypes.func,
  onScanSuccess: PropTypes.func,
  onSheetLayout: PropTypes.func,
  sheetHeight: PropTypes.number,
  walletConnectorsByDappName: PropTypes.arrayOf(PropTypes.object),
  walletConnectorsCount: PropTypes.number,
};

const arePropsEqual = (prev, next) =>
  !isNewValueForObjectPaths(prev, next, [
    'enableScanning',
    'isCameraAuthorized',
    'sheetHeight',
    'walletConnectorsCount',
    'modalVisible',
  ]);

export default React.memo(QRScannerScreen, arePropsEqual);
