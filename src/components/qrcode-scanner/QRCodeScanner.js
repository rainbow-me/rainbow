import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Permissions from 'react-native-permissions';
import ReactNativeQRCodeScanner from 'react-native-qrcode-scanner';
import styled from 'styled-components/primitives';
import CrosshairAsset from '../../assets/qrcode-scanner-crosshair.png';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const CAMERA_PERMISSION = 'camera';
const PERMISSION_AUTHORIZED = 'authorized';

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
    isAuthorized: false,
    isInitialized: false,
  }

  initializionTimeout = null

  componentDidMount = () => {
    this.handleIsAuthorized();

    this.initializionTimeout = setTimeout(() => {
      this.initializionTimeout = 0;
      if (!this.state.isInitialized) {
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
    console.log('📷 ✅ CAMERA READY');
    this.handleDidInitialize();
    if (this.props.onCameraReady) this.props.onCameraReady();
  }

  handleDidInitialize = () => this.setState({ isInitialized: true })

  handleError = error => this.setState({ error })

  handleIsAuthorized = () => {
    Permissions.request(CAMERA_PERMISSION).then((response) => {
      this.setState({ isAuthorized: response === PERMISSION_AUTHORIZED });
    });
  }

  handleMountError = () => {
    console.log('📷 🚨 CAMERA MOUNT ERROR');
    this.handleError('mounting');
  }

  render = () => {
    const { onSuccess, scannerRef } = this.props;
    const { error, isAuthorized, isInitialized } = this.state;

    const showCrosshair = !error && isAuthorized && isInitialized;
    const showErrorMessage = error && isAuthorized && !isInitialized;

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
          reactivate={true}
          reactivateTimeout={1000}
          ref={scannerRef}
          topViewStyle={styles.disableSection}
        />
        {showErrorMessage && (
          <ErrorText
            color={colors.red}
            error={`Error ${error} camera`}
          />
        )}
        {showCrosshair && (
          <CrosshairContainer>
            <Crosshair source={CrosshairAsset} />
          </CrosshairContainer>
        )}
      </Container>
    );
  }
}
