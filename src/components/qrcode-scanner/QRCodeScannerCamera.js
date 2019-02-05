import { isFunction } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import ReactNativeQRCodeScanner from 'react-native-qrcode-scanner';
import stylePropType from 'react-style-proptype';
import { position } from '../../styles';
import { deviceUtils } from '../../utils';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const styles = StyleSheet.create({
  disableSection: {
    flex: 0,
    height: 0,
  },
  fullscreen: {
    ...deviceUtils.dimensions,
    ...position.coverAsObject,
  },
});

export default class QRCodeScannerCamera extends Component {
  static propTypes = {
    contentStyles: stylePropType,
    enableScanning: PropTypes.bool,
    onCameraReady: PropTypes.func,
    onMountError: PropTypes.func,
    onSuccess: PropTypes.func,
    scannerRef: PropTypes.func,
  }

  componentDidUpdate = () => {
    const { enableScanning } = this.props;

    if (!this.scannerRef) return;

    InteractionManager.runAfterInteractions(() => {
      const isScannerEnabled = this.scannerRef && !this.scannerRef.state.disablingByUser;

      if (enableScanning && !isScannerEnabled) {
        this.handleEnableScanner();
      } else if (!enableScanning && isScannerEnabled) {
        this.handleDisableScanner();
      }
    });
  }

  handleDisableScanner = () => {
    if (this.scannerRef && isFunction(this.scannerRef.disable)) {
      console.log('📠🚫 Disabling QR Code Scanner');
      this.scannerRef.disable();
    }
  }

  handleEnableScanner = () => {
    if (this.scannerRef && isFunction(this.scannerRef.enable)) {
      console.log('📠✅ Enabling QR Code Scanner');
      this.scannerRef.enable();
    }
  }

  handleScannerRef = (ref) => { this.scannerRef = ref; }

  render = () => (
    <ReactNativeQRCodeScanner
      bottomViewStyle={styles.disableSection}
      cameraProps={{
        captureAudio: false,
        onCameraReady: this.props.onCameraReady,
        onMountError: this.props.onMountError,
      }}
      cameraStyle={styles.fullscreen}
      containerStyle={styles.fullscreen}
      notAuthorizedView={<QRCodeScannerNeedsAuthorization />}
      onRead={this.props.onSuccess}
      pendingAuthorizationView={<QRCodeScannerNeedsAuthorization />}
      reactivate={true}
      reactivateTimeout={1000}
      ref={this.handleScannerRef}
      topViewStyle={styles.disableSection}
      vibrate={false}
    />
  )
}
