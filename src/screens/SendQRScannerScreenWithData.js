import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertIOS } from 'react-native';
import { get } from 'lodash';
import QRScannerScreen from './QRScannerScreen';

export default class SendQRScannerScreenWithData extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    enableScanning: true,
  }

  handlePressBackButton = () => {
    const { navigation } = this.props;
    const onBack = get(navigation, 'state.params.onBack', () => {});


    navigation.goBack();
    onBack();
  }

  handleSuccess = async (event) => {
    const { navigation } = this.props;
    const onSuccess = get(navigation, 'state.params.onSuccess', () => {});

    this.setState({ enableScanning: false });

    if (event.data) {
      const parts = event.data.split(':');

      if (parts[0] === 'ethereum') {
        onSuccess(parts[1]);
        navigation.goBack();

        this.setState({ enableScanning: true });
      } else {
        AlertIOS.alert('Invalid Address', 'Sorry, this QR code doesn\'t contain an Ethereum address.', () => {
          this.setState({ enableScanning: true });
        });
      }
    }
  }

  render() {
    const { enableScanning } = this.state;

    return (
      <QRScannerScreen
        {...this.props}
        isScreenActive={enableScanning}
        onPressBackButton={this.handlePressBackButton}
        onSuccess={this.handleSuccess}
      />
    );
  }
}
