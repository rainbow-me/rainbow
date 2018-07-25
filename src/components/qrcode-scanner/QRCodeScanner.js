import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import ReactNativeQRCodeScanner from 'react-native-qrcode-scanner';
import styled from 'styled-components/primitives';
import CrosshairAsset from '../../assets/qrcode-scanner-crosshair.png';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const styles = StyleSheet.create({
  disableSection: {
    flex: 0,
    height: 0,
  },
  fullscreen: {
    ...position.coverAsObject,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
});

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover}
  background-color: ${colors.black};
`;

const Crosshair = styled.Image`
  ${position.size(Dimensions.get('window').width * (293 / 375))}
  margin-bottom: 1;
  resize-mode: contain;
`;

const CrosshairContainer = styled(Centered)`
  ${position.cover}
`;

export default class QRCodeScanner extends Component {
  static propTypes = {
    onCameraReady: PropTypes.func,
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
      this.initializionTimeout = 0;
      if (this.state.isInitializing) {
        this.handleError('initializing');
      }
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
    this.handleDidInitialize();
    if (this.props.onCameraReady) this.props.onCameraReady();
  }

  handleDidInitialize = () => this.setState({ isInitializing: false })
  handleError = error => this.setState({ error })

  handleMountError = () => {
    console.log('📷🚨 CAMERA MOUNT ERROR');
    this.handleDidInitialize();
    this.handleError('mounting');
  }

  render = () => {
    const { onSuccess, scannerRef } = this.props;
    const { error } = this.state;

    return (
      <Container>
        <ReactNativeQRCodeScanner
          bottomViewStyle={styles.disableSection}
          cameraProps={{
            onCameraReady: this.handleCameraReady,
            onMountError: this.handleMountError,
          }}
          cameraStyle={styles.fullscreen}
          containerStyle={styles.fullscreen}
          notAuthorizedView={<QRCodeScannerNeedsAuthorization />}
          onRead={onSuccess}
          pendingAuthorizationView={<QRCodeScannerNeedsAuthorization />}
          ref={scannerRef}
          topViewStyle={styles.disableSection}
        />
        {error ? (
          <ErrorText
            color={colors.red}
            error={`Error ${error} camera`}
          />
        ) : (
          <CrosshairContainer>
            <Crosshair source={CrosshairAsset} />
          </CrosshairContainer>
        )}
      </Container>
    );
  }
}
