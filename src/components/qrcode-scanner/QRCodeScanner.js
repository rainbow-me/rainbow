import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import ReactNativeQRCodeScanner from 'react-native-qrcode-scanner';
import { compose, withHandlers, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { Centered, Column, Row } from '../layout';
import { ErrorText, Monospace } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const coverStyle = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

const styles = StyleSheet.create({
  cameraContainer: {
    ...coverStyle,
    backgroundColor: colors.blue,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  containerStyle: coverStyle,
  zeroContainer: {
    flex: 0,
    height: 0,
  },
});

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover}
  background-color: ${colors.black};
`;

export default class QRCodeScanner extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    navigation: PropTypes.object,
    onCameraReady: PropTypes.func,
    onMountError: PropTypes.func,
    onSuccess: PropTypes.func,
    scannerRef: PropTypes.func,
  }

  state = {
    error: null,
    isInitializing: true,
  }

  initializionTimeout = null

  componentDidMount = () => {
    this.initializionTimeout = setTimeout(() => {
      this.handleInitialization();
      this.handleError('initializing');
      this.initializionTimeout = 0;
    }, 5000);
  }

  componentWillUnmount = () => {
    if (this.initializionTimeout) {
      clearTimeout(this.initializionTimeout);
      this.initializionTimeout = 0;
    }
  }

  handleCameraReady = () => {
    console.log('✅📷 CAMERA READY');
    this.handleInitialization();
    if (this.props.onCameraReady) this.props.onCameraReady();
  }

  handleError = error => this.setState({ error })
  handleInitialization = () => this.setState({ isInitializing: false })

  handleMountError = () => {
    console.log('📷🚨 CAMERA MOUNT ERROR');
    this.handleInitialization();
    this.handleError('mounting');
  }

  render = () => {
    const { onSuccess, scannerRef } = this.props;
    const { error, isInitializing } = this.state;

    return (
      <Container>
        <ReactNativeQRCodeScanner
          bottomViewStyle={styles.zeroContainer}
          cameraProps={{
            onCameraReady: this.handleCameraReady,
            onMountError: this.handleMountError,
          }}
          cameraStyle={styles.cameraContainer}
          containerStyle={styles.containerStyle}
          notAuthorizedView={<QRCodeScannerNeedsAuthorization />}
          onRead={onSuccess}
          pendingAuthorizationView={<QRCodeScannerNeedsAuthorization />}
          ref={scannerRef}
          topViewStyle={styles.zeroContainer}
        />
        {error && (
          <ErrorText
            color={colors.red}
            error={`Error ${error} camera`}
          />
        )}
        {isInitializing && (
          <Monospace color="white">
            initializing...
          </Monospace>
        )}
      </Container>
    );
  }
}
