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

const QRScannerScreen = ({
  isScreenActive,
  onPressBackButton,
  onSuccess,
  ...props
}) => (
  <Container>
    <QRCodeScanner
      {...props}
      enableScanning={isScreenActive}
      onSuccess={onSuccess}
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
  isScreenActive: PropTypes.bool.isRequired,
  onPressBackButton: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default pure(QRScannerScreen);
