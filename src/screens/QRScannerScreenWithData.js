import { withSafeTimeout } from '@hocs/safe-timers';
import { isEmulatorSync } from 'react-native-device-info';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Platform, Vibration } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { Alert, Prompt } from '../components/alerts';
import {
  withAccountAddress,
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
} from '../hoc';
import { addressUtils } from '../utils';
import QRScannerScreen from './QRScannerScreen';
import withStatusBarStyle from '../hoc/withStatusBarStyle';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
    walletConnectOnSessionRequest: PropTypes.func,
  };

  state = {
    enableScanning: true,
    isCameraAuthorized: true,
    isFocused: false,
    sheetHeight: 240,
  };

  static getDerivedStateFromProps(props, state) {
    const isFocused = props.navigation.isFocused();
    return { ...state, isFocused };
  }

  componentDidUpdate = (prevProps, prevState) => {
    const wasFocused = prevState.isFocused;
    const isFocused = this.state.isFocused;

    if (isFocused && !wasFocused && Platform.OS === 'ios') {
      request(PERMISSIONS.IOS.CAMERA).then(permission => {
        const isCameraAuthorized = permission === 'granted';
        if (prevState.isCameraAuthorized !== isCameraAuthorized) {
          this.setState({ isCameraAuthorized });
        }
      });

      // eslint-disable-next-line react/no-did-update-set-state
      !this.state.enableScanning && this.setState({ enableScanning: true });
    }
  };

  handleSheetLayout = ({ nativeEvent }) => {
    this.setState({ sheetHeight: get(nativeEvent, 'layout.height') });
  };

  handlePastedUri = async uri => this.props.walletConnectOnSessionRequest(uri);

  handlePressBackButton = () => this.props.navigation.navigate('WalletScreen');

  handlePressPasteSessionUri = () => {
    Prompt({
      callback: this.handlePastedUri,
      message: 'Paste WalletConnect URI below',
      title: 'New WalletConnect Session',
      type: 'plain-text',
    });
  };

  handleReenableScanning = () => this.setState({ enableScanning: true });

  handleScanSuccess = async ({ data }) => {
    const {
      walletConnectOnSessionRequest,
      navigation,
      setSafeTimeout,
    } = this.props;

    if (!data) return null;
    this.setState({ enableScanning: false });
    if (!isEmulatorSync()) {
      Vibration.vibrate();
    }

    const address = await addressUtils.getEthereumAddressFromQRCodeData(data);

    if (address) {
      analytics.track('Scanned address QR code');
      navigation.navigate('WalletScreen');
      navigation.navigate('SendSheet', { address });
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    if (data.startsWith('wc:')) {
      analytics.track('Scanned WalletConnect QR code');
      await walletConnectOnSessionRequest(data);
      return setSafeTimeout(this.handleReenableScanning, 2000);
    }

    analytics.track('Scanned broken or unsupported QR code', {
      qrCodeData: data,
    });
    return Alert({
      callback: this.handleReenableScanning,
      message: lang.t('wallet.unrecognized_qrcode'),
      title: lang.t('wallet.unrecognized_qrcode_title'),
    });
  };

  render() {
    return (
      <QRScannerScreen
        {...this.props}
        {...this.state}
        isFocused={this.state.isFocused}
        enableScanning={this.state.enableScanning && this.state.isFocused}
        onPressBackButton={this.handlePressBackButton}
        onPressPasteSessionUri={this.handlePressPasteSessionUri}
        onScanSuccess={this.handleScanSuccess}
        onSheetLayout={this.handleSheetLayout}
      />
    );
  }
}

export default compose(
  withNavigationFocus,
  withWalletConnectOnSessionRequest,
  withAccountAddress,
  withSafeTimeout,
  withWalletConnectConnections,
  withStatusBarStyle('light-content')
)(QRScannerScreenWithData);
