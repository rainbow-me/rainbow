import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Vibration } from 'react-native';
import firebase from 'react-native-firebase';
import Piwik from 'react-native-matomo';
import { compose } from 'recompact';
import { Alert } from '../components/alerts';
import { walletConnectInit } from '../model/walletconnect';
import { withAccountAddress, withAddWalletConnector } from '../hoc';
import { getEthereumAddressFromQRCodeData } from '../utils';
import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    addWalletConnector: PropTypes.func,
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
  }

  state = { enableScanning: true }

  componentDidUpdate = (prevProps) => {
    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      this.setState({ enableScanning: true });
      Piwik.trackScreen('QRScannerScreen', 'QRScannerScreen');
    }
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
          onPress: async () => firebase
                               .messaging()
                               .requestPermission(),
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
      navigation.navigate('SendScreen', { address });
      setSafeTimeout(this.handleReenableScanning, 1000);
    } else if (data.startsWith('ethereum:wc')) {
      Piwik.trackEvent('QRScanner', 'walletconnect', 'QRScannedWC');
      const walletConnector = await walletConnectInit(
        accountAddress,
        data
      );
      await this.checkPushNotificationPermissions();
      addWalletConnector(walletConnector);
      setSafeTimeout(this.handleReenableScanning, 1000);
    } else {
      Piwik.trackEvent('QRScanner', 'unknown', 'QRScannedUnknown');
      Alert({
        message: lang.t('wallet.unrecognized_qrcode'),
        title: lang.t('wallet.unrecognized_qrcode_title'),
        callback: this.handleReenableScanning,
      });
    }
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      enableScanning={this.state.enableScanning && this.props.isScreenActive}
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleScanSuccess}
    />
  )
}

export default compose(
  withAccountAddress,
  withAddWalletConnector,
  withSafeTimeout,
)(QRScannerScreenWithData);
