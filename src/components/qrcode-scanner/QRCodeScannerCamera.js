import { withSafeTimeout } from '@hocs/safe-timers';
import { isFunction } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Dimensions, InteractionManager, StyleSheet } from 'react-native';
import ReactNativeQRCodeScanner from 'react-native-qrcode-scanner';
import { position } from '../../styles';
import { logger } from '../../utils';
import QRCodeScannerNeedsAuthorization from './QRCodeScannerNeedsAuthorization';

const sx = StyleSheet.create({
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

class QRCodeScannerCamera extends PureComponent {
  static propTypes = {
    enableScanning: PropTypes.bool,
    onCameraReady: PropTypes.func,
    onMountError: PropTypes.func,
    onSuccess: PropTypes.func,
    setSafeTimeout: PropTypes.func,
  };

  state = {
    showAuthorizationView: false,
  };

  componentDidMount = () => {
    this.props.setSafeTimeout(this.handleShowAuthorizationView, 500);
  };

  componentDidUpdate = () => {
    const { enableScanning } = this.props;

    if (!this.scannerRef) return;

    InteractionManager.runAfterInteractions(() => {
      const isScannerEnabled =
        this.scannerRef && !this.scannerRef.state.scanning;

      if (enableScanning && !isScannerEnabled) {
        this.handleEnableScanner();
      } else if (!enableScanning && isScannerEnabled) {
        this.handleDisableScanner();
      }
    });
  };

  handleDisableScanner = () => {
    if (this.scannerRef && isFunction(this.scannerRef.disable)) {
      logger.log('📠🚫 Disabling QR Code Scanner');
      this.scannerRef.disable();
    }
  };

  handleEnableScanner = () => {
    if (this.scannerRef && isFunction(this.scannerRef.enable)) {
      logger.log('📠✅ Enabling QR Code Scanner');
      this.scannerRef.enable();
    }
  };

  handleScannerRef = ref => {
    this.scannerRef = ref;
  };

  handleShowAuthorizationView = () =>
    this.setState({ showAuthorizationView: true });

  renderAuthorizationView = () =>
    this.state.showAuthorizationView ? (
      <QRCodeScannerNeedsAuthorization />
    ) : null;

  render = () => (
    <ReactNativeQRCodeScanner
      bottomViewStyle={sx.disableSection}
      cameraProps={{
        captureAudio: false,
        onCameraReady: this.props.onCameraReady,
        onMountError: this.props.onMountError,
      }}
      cameraStyle={sx.fullscreen}
      containerStyle={sx.fullscreen}
      notAuthorizedView={this.renderAuthorizationView()}
      onRead={this.props.onSuccess}
      pendingAuthorizationView={this.renderAuthorizationView()}
      reactivate
      reactivateTimeout={1000}
      ref={this.handleScannerRef}
      topViewStyle={sx.disableSection}
      vibrate={false}
    />
  );
}

export default withSafeTimeout(QRCodeScannerCamera);
