import { isValidAddress } from 'balance-common';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Vibration } from 'react-native';
import { Alert } from '../components/alerts';
import { statusBar } from '../utils';
import QRScannerScreen from './QRScannerScreen';

export default class SendQRScannerScreenWithData extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    enableScanning: true,
  }

  componentDidMount() {
    statusBar.setBarStyle('light-content', true);
  }

  handlePressBackButton = () => {
    const { navigation } = this.props;
    const onBack = get(navigation, 'state.params.onBack', () => {});

    navigation.goBack();
    onBack();
  }

  handleSuccess = async ({ data }) => {
    const { navigation } = this.props;
    const onSuccess = get(navigation, 'state.params.onSuccess', () => {});

    this.setState({ enableScanning: false });

    if (!data) return null;
    const parts = data.split(':');
    const address =
      (parts[0] === 'ethereum' && isValidAddress(parts[1])) ?
        parts[1] : isValidAddress(parts[0]) ?
          parts[0] : null;

    if (address) {
      Vibration.vibrate();
      onSuccess(address);
      navigation.goBack();

      this.handleEnableScanning();
    } else {
      Alert({
        callback: this.handleEnableScanning,
        message: 'Sorry, this QR code doesn\'t contain an Ethereum address.',
        title: 'Invalid Address',
      });
    }
  }

  handleEnableScanning = () => this.setState({ enableScanning: true })

  render = () => (
    <QRScannerScreen
      {...this.props}
      enableScanning={this.state.enableScanning}
      isScreenActive={this.state.enableScanning}
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleSuccess}
      showWalletConnectSheet={false}
    />
  )
}
