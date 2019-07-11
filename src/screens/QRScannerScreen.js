import PropTypes from 'prop-types';
import React from 'react';
import DeviceInfo from 'react-native-device-info';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { BubbleSheet } from '../components/bubble-sheet';
import { Button } from '../components/buttons';
import { BackButton, Header } from '../components/header';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { WalletConnectExplainer, WalletConnectList } from '../components/walletconnect-list';
import { colors, position } from '../styles';
import { safeAreaInsetValues } from '../utils';

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

const QRScannerScreen = ({
  enableScanning,
  isCameraAuthorized,
  isFocused,
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
      {walletConnectorsCount
        ? <WalletConnectList items={walletConnectorsByDappName} />
        : <WalletConnectExplainer />
      }
    </BubbleSheet>
  </Container>
);

QRScannerScreen.propTypes = {
  enableScanning: PropTypes.bool,
  isCameraAuthorized: PropTypes.bool,
  isFocused: PropTypes.bool.isRequired,
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
