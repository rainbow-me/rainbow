import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { compose, withHandlers, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { Button } from '../components/buttons';
import Icon from '../components/icons/Icon';
import { Header, HeaderButton } from '../components/header';
import { Centered, Column, Row } from '../components/layout';
import { QRCodeScanner } from '../components/qrcode-scanner';
import { Monospace } from '../components/text';
import { colors, fonts, padding, position } from '../styles';
import { Transition } from 'react-navigation-fluid-transitions';

const coverStyle = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

const BackButton = styled.View`
  ${padding(20, 20, 4, 0)}
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.size('100%')}
  background-color: ${colors.black};
`;

const QRScannerHeader = styled(Header)`
  position: absolute;
  top: 0;
`;

const enhance = compose(
  withHandlers({
    onPressBackButton: ({ navigation, ...props }) => () => {
      console.log('☝️☝️☝️☝️☝️☝️☝️☝️☝️☝️PROPS', props);
      navigation.goBack();
    },
  }),
);

const QRScannerScreen = enhance(({
  onPressBackButton,
  onSuccess,
  scannerRef,
}) => (
      <Transition appear="horizontal">
  <Container>
    <QRCodeScanner onSuccess={onSuccess} scannerRef={scannerRef} />
    <QRScannerHeader align="end" justify="start">
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
      </Transition>
));

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

export default QRScannerScreen;

// compose(
//   withHandlers({
//     onPressBackButton: ({ navigation, ...props }) => () => {
//       console.log('☝️☝️☝️☝️☝️☝️☝️☝️☝️☝️PROPS', props);
//       navigation.goBack();
//     },
//   }),
// )(QRScannerScreen);
