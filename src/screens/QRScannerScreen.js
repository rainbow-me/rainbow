import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
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

const QRScannerScreen = ({ onPressBackButton, onSuccess, scannerRef }) => (
  <Container>
    <QRCodeScanner
      {...this.props}
      onSuccess={onSuccess}
      scannerRef={scannerRef}
    />
    <QRScannerHeader>
      <BackButton
        color={colors.white}
        direction="left"
        onPress={onPressBackButton}
      />
    </QRScannerHeader>
  </Container>
);

QRScannerScreen.propTypes = {
  onPressBackButton: PropTypes.func,
  onSuccess: PropTypes.func,
  scannerRef: PropTypes.func,
};

export default pure(QRScannerScreen);
