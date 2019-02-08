import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Vibration } from 'react-native';
import firebase from 'react-native-firebase';
import Piwik from 'react-native-matomo';
import Permissions from 'react-native-permissions';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { Alert } from '../components/alerts';
import {
  withAccountAddress,
  withAddWalletConnector,
  withWalletConnectConnections,
} from '../hoc';
import { walletConnectInit } from '../model/walletconnect';
import { getEthereumAddressFromQRCodeData } from '../utils';
import QRScannerScreen from './QRScannerScreen';
import withStatusBarStyle from '../hoc/withStatusBarStyle';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    addWalletConnector: PropTypes.func,
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
  }

  state = {
    enableScanning: true,
    isCameraAuthorized: true,
    sheetHeight: 240,
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.isFocused && !prevProps.isFocused) {
      Permissions.request('camera').then(permission => {
        const isCameraAuthorized = permission === 'authorized';

        if (prevState.isCameraAuthorized !== isCameraAuthorized) {
          this.setState({ isCameraAuthorized });
        }
      });

      this.setState({ enableScanning: true });
      Piwik.trackScreen('QRScannerScreen', 'QRScannerScreen');
    }
  }

  handleSheetLayout = ({ nativeEvent }) => {
    this.setState({ sheetHeight: get(nativeEvent, 'layout.height') });
  }

  handlePressBackButton = () => this.props.navigation.navigate('WalletScreen')

  handleReenableScanning = () => this.setState({ enableScanning: true })

  checkPushNotificationPermissions = async () => {
    const arePushNotificationsAuthorized = await firebase
      .messaging()
      .hasPermission();

    if (!arePushNotificationsAuthorized) {
      // TODO: try catch around Alert?
      Alert({
        buttons: [{
          onPress: async () => firebase.messaging().requestPermission(),
          text: 'Okay',
        }, {
          style: 'cancel',
          text: 'Dismiss',
        }],
        message: lang.t('wallet.push_notifications.please_enable_body'),
        title: lang.t('wallet.push_notifications.please_enable_title'),
      });
    }
  }

  handleScanSuccess = async ({ data }) => {
    const {
      accountAddress,
      addWalletConnector,
      navigation,
      setSafeTimeout,
    } = this.props;

    if (!data) return null;
    this.setState({ enableScanning: false });
    Vibration.vibrate();

    const address = getEthereumAddressFromQRCodeData(data);

    if (address) {
      Piwik.trackEvent('QRScanner', 'address', 'QRScannedAddress');
      navigation.navigate('WalletScreen');
      navigation.navigate('SendSheet', { address });
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    if (data.startsWith('ethereum:wc')) {
      Piwik.trackEvent('QRScanner', 'walletconnect', 'QRScannedWC');
      const walletConnector = await walletConnectInit(accountAddress, data);
      await this.checkPushNotificationPermissions();
      addWalletConnector(walletConnector);
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    Piwik.trackEvent('QRScanner', 'unknown', 'QRScannedUnknown');
    return Alert({
      callback: this.handleReenableScanning,
      message: lang.t('wallet.unrecognized_qrcode'),
      title: lang.t('wallet.unrecognized_qrcode_title'),
    });
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      {...this.state}
      enableScanning={this.state.enableScanning && this.props.isFocused}
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleScanSuccess}
      onSheetLayout={this.handleSheetLayout}
    />
  )
}

export default compose(
  withNavigationFocus,
  withAccountAddress,
  withAddWalletConnector,
  withSafeTimeout,
  withWalletConnectConnections,
  withStatusBarStyle('light-content'),
)(QRScannerScreenWithData);
