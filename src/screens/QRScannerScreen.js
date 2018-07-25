import PropTypes from 'prop-types';
import React from 'react';
import { withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { Header, HeaderButton } from '../components/header';
import Icon from '../components/icons/Icon';
import { Centered } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { colors, padding, position } from '../styles';

const BackButton = styled.View`
  ${padding(20, 20, 4, 0)}
`;

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
      <HeaderButton onPress={onPressBackButton}>
        <BackButton>
          <Icon
            color={colors.white}
            direction="left"
            name="caret"
          />
        </BackButton>
      </HeaderButton>
    </QRScannerHeader>
  </Container>
);

QRScannerScreen.propTypes = {
  accountAddress: PropTypes.string,
  isError: PropTypes.bool,
  navigation: PropTypes.object,
  onPressBackButton: PropTypes.func,
  onCameraReady: PropTypes.func,
  onMountError: PropTypes.func,
  onSuccess: PropTypes.func,
  scannerRef: PropTypes.func,
};

export default withHandlers({
  onPressBackButton: ({ navigation }) => () => navigation.goBack(),
})(QRScannerScreen);
