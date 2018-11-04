import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, pure, withHandlers, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { BackButton, Header } from '../components/header';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { WalletConnectList } from '../components/walletconnect-list';
import { withWalletConnectConnections, withSafeAreaViewInsetValues } from '../hoc';
import { colors, position } from '../styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.size('100%')}
  background-color: ${colors.black};
  overflow: hidden;
`;

const QRScannerHeader = styled(Header).attrs({
  align: 'end',
  justify: 'start',
})`
  position: absolute;
  top: 0;
`;

const QRScannerScreen = ({
  isScreenActive,
  onPressBackButton,
  onScanSuccess,
  onSheetLayout,
  sheetHeight,
  showWalletConnectSheet,
  walletConnectorsCount,
}) => {
  const showSheet = showWalletConnectSheet && !!walletConnectorsCount;

  return (
    <Container>
      {isScreenActive && (
        <QRCodeScanner
          {...this.props}
          contentStyles={{
            bottom: showSheet ? sheetHeight : 0,
            top: showSheet ? Header.height : 0,
          }}
          onSuccess={onScanSuccess}
        />
      )}
      <QRScannerHeader>
        <BackButton
          color={colors.white}
          direction="left"
          onPress={onPressBackButton}
        />
      </QRScannerHeader>
      {showSheet && (<WalletConnectList onLayout={onSheetLayout}/>)}
    </Container>
  );
};

QRScannerScreen.propTypes = {
  isScreenActive: PropTypes.bool.isRequired,
  onPressBackButton: PropTypes.func,
  onScanSuccess: PropTypes.func,
  onSheetLayout: PropTypes.func,
  sheetHeight: PropTypes.number,
  showWalletConnectSheet: PropTypes.bool,
  walletConnectorsCount: PropTypes.number,
};

QRScannerScreen.defaultProps = {
  showWalletConnectSheet: true,
};

export default compose(
  pure,
  withState('sheetHeight', 'setSheetHeight', null),
  withSafeAreaViewInsetValues,
  withWalletConnectConnections,
  withHandlers({
    onSheetLayout: ({ setSheetHeight }) => ({ nativeEvent }) =>
      setSheetHeight(get(nativeEvent, 'layout.height')),
  }),
)(QRScannerScreen);
