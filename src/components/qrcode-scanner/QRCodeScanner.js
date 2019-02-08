import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import stylePropType from 'react-style-proptype';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerCamera from './QRCodeScannerCamera';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';

export default class QRCodeScanner extends PureComponent {
  static propTypes = {
    contentStyles: stylePropType,
    enableCamera: PropTypes.bool,
    enableScanning: PropTypes.bool,
    isCameraAuthorized: PropTypes.bool,
    onCameraReady: PropTypes.func,
    onSuccess: PropTypes.func,
    setSafeTimeout: PropTypes.func,
    showCrosshairText: PropTypes.bool,
  }

  state = {
    error: null,
    isInitialized: false,
  }

  handleCameraReady = () => this.setState({ isInitialized: true })

  handleMountError = () => this.setState({ error: 'mounting' })

  render = () => {
    const {
      contentStyles,
      enableCamera,
      enableScanning,
      isCameraAuthorized,
      onSuccess,
      showCrosshairText,
    } = this.props;
    const { error, isInitialized } = this.state;

    const showErrorMessage = error && !isInitialized;
    const showCrosshair = !error && !showErrorMessage;

    return (
      <Centered
        direction="column"
        style={{ backgroundColor: colors.black, ...position.coverAsObject }}
      >
        {enableCamera && (
          <QRCodeScannerCamera
            enableScanning={enableScanning}
            onCameraReady={this.handleCameraReady}
            onMountError={this.handleMountError}
            onSuccess={onSuccess}
          />
        )}
        {isCameraAuthorized && (
          <Centered style={[position.coverAsObject, contentStyles]}>
            {showErrorMessage && <ErrorText color={colors.red} error={`Error ${error} camera`} />}
            {showCrosshair && <QRCodeScannerCrosshair showText={showCrosshairText} />}
          </Centered>
        )}
      </Centered>
    );
  }
}
