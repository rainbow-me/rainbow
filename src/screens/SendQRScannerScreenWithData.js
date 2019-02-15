import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Vibration } from 'react-native';
import { Alert } from '../components/alerts';
import { getEthereumAddressFromQRCodeData, statusBar } from '../utils';
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

  handleEnableScanning = () => this.setState({ enableScanning: true })

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
    const address = getEthereumAddressFromQRCodeData(data);

    if (address) {
      Vibration.vibrate();
      onSuccess(address);
      navigation.goBack();

      return this.handleEnableScanning();
    }

    return Alert({
      callback: this.handleEnableScanning,
      message: 'Sorry, this QR code doesn\'t contain an Ethereum address.',
      title: 'Invalid Address',
    });
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      enableScanning={this.state.enableScanning}
      isFocused={this.state.enableScanning}
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleSuccess}
      showWalletConnectSheet={false}
    />
  )
}
