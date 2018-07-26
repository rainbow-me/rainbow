import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components/primitives';
import { BackButton, Header } from '../components/header';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { colors, position } from '../styles';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.size('100%')}
  background-color: ${colors.black};
`;

const QRScannerHeader = styled(Header).attrs({
  align: 'end',
  justify: 'start',
})`
  position: absolute;
  top: 0;
`;

const QRScannerScreen = ({ onSuccess, scannerRef }) => (
  <Container>
    <StatusBar barStyle="light-content" />
    <QRCodeScanner
      {...this.props}
      onSuccess={onSuccess}
      scannerRef={scannerRef}
    />
    <QRScannerHeader>
      <BackButton
        color={colors.white}
        direction="left"
      />
    </QRScannerHeader>
  </Container>
);

QRScannerScreen.propTypes = {
  onSuccess: PropTypes.func,
  scannerRef: PropTypes.func,
};

export default QRScannerScreen;
