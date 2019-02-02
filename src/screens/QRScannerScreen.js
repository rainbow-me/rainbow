import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { BackButton, Header } from '../components/header';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { WalletConnectExplainer, WalletConnectList } from '../components/walletconnect-list';
import { colors, position } from '../styles';
import { BubbleSheet } from '../components/bubble-sheet';

const Container = styled(Centered)`
  ${position.size('100%')};
  background-color: ${colors.black};
  overflow: hidden;
`;

const QRScannerScreenHeader = styled(Header).attrs({ align: 'end', justify: 'start' })`
  position: absolute;
  top: 0;
`;

const WalletConnectBubbleSheet = styled(BubbleSheet)`
  bottom: 21;
  overflow: hidden;
`;

// 😇️ use these for testing if u want LOL
//
// const fakeDapps = times(3, (i) => ({
//   dappName: `Balance Manager${i}`,
//   expires: 1548966057000 * (i + 1),
// }));

const QRScannerScreen = ({
  enableScanning,
  isCameraAuthorized,
  isScreenActive,
  onPressBackButton,
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
      enableCamera={isScreenActive}
      enableScanning={enableScanning}
      isCameraAuthorized={isCameraAuthorized}
      onSuccess={onScanSuccess}
      showCrosshairText={!!walletConnectorsCount}
    />
    <QRScannerScreenHeader>
      <BackButton
        color={colors.white}
        direction="left"
        onPress={onPressBackButton}
      />
    </QRScannerScreenHeader>
    <WalletConnectBubbleSheet onLayout={onSheetLayout}>
      {walletConnectorsCount
        ? <WalletConnectList items={walletConnectorsByDappName} />
        : <WalletConnectExplainer />
      }
    </WalletConnectBubbleSheet>
  </Container>
);

QRScannerScreen.propTypes = {
  enableScanning: PropTypes.bool,
  isCameraAuthorized: PropTypes.bool,
  isScreenActive: PropTypes.bool.isRequired,
  onPressBackButton: PropTypes.func,
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
  'isScreenActive',
  'sheetHeight',
  'walletConnectorsCount',
])(QRScannerScreen);
