import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import SimulatorFakeCameraImageSource from '../../assets/simulator-fake-camera-image.jpg';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerCamera from './QRCodeScannerCamera';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  background-color: ${colors.black};
`;

export default class QRCodeScanner extends PureComponent {
  static propTypes = {
    contentStyles: stylePropType,
    enableCamera: PropTypes.bool,
    enableScanning: PropTypes.bool,
    isCameraAuthorized: PropTypes.bool,
    onCameraReady: PropTypes.func,
    onSuccess: PropTypes.func,
    showCrosshairText: PropTypes.bool,
  }

  state = {
    error: null,
    isInitialized: false,
  }

  handleCameraReady = () => this.setState({ isInitialized: true })

  handleMountError = () => this.setState({ error: 'mounting' })

  renderCamera = () => {
    if (DeviceInfo.isEmulator()) {
      return (
        <FastImage
          source={SimulatorFakeCameraImageSource}
          style={position.sizeAsObject('100%')}
        />
      );
    }

    return this.props.enableCamera ? (
      <QRCodeScannerCamera
        enableScanning={this.props.enableScanning}
        onCameraReady={this.handleCameraReady}
        onMountError={this.handleMountError}
        onSuccess={this.props.onSuccess}
      />
    ) : null;
  }

  render = () => {
    const { contentStyles, isCameraAuthorized, showCrosshairText } = this.props;
    const { error, isInitialized } = this.state;

    const showErrorMessage = error && !isInitialized;
    const showCrosshair = !error && !showErrorMessage;

    return (
      <Container>
        {this.renderCamera()}
        {isCameraAuthorized && (
          <Centered style={[position.coverAsObject, contentStyles]}>
            {showErrorMessage && (
              <ErrorText
                color={colors.red}
                error={`Error ${error} camera`}
              />
            )}
            {showCrosshair && (
              <QRCodeScannerCrosshair
                showText={showCrosshairText || DeviceInfo.isEmulator()}
                text={DeviceInfo.isEmulator() ? 'Simulator Mode' : undefined}
              />
            )}
          </Centered>
        )}
      </Container>
    );
  }
}
