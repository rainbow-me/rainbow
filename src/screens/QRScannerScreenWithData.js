import { withSafeTimeout } from '@hocs/safe-timers';
import { isValidAddress } from 'balance-common';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Vibration } from 'react-native';
import firebase from 'react-native-firebase';
import { compose } from 'recompact';
import { withAccountAddress, withAddWalletConnector } from '../hoc';
import { Alert } from '../components/alerts';
import { walletConnectInit } from '../model/walletconnect';
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
    }
  }

  handlePressBackButton = () => this.props.navigation.push('WalletScreen')

  handleReenableScanning = () => this.setState({ enableScanning: true })

  handleScanSuccess = async ({ data }) => {
    const {
      accountAddress,
      addWalletConnector,
      navigation,
      setSafeTimeout,
    } = this.props;

    if (!data) return null;

    this.setState({ enableScanning: false });
    setSafeTimeout(this.handleReenableScanning, 1000);

    const parts = data.split(':');
    const address =
      (parts[0] === 'ethereum' && isValidAddress(parts[1])) ?
        parts[1] : isValidAddress(parts[0]) ?
          parts[0] : null;

    if (address) {
      Vibration.vibrate();
      return navigation.navigate('SendScreen', { address });
    }

    try {
      const walletConnector = await walletConnectInit(accountAddress, data);
      const arePushNotificationsAuthorized = await firebase.messaging().hasPermission();

      Vibration.vibrate();

      if (!arePushNotificationsAuthorized) {
        try {
          Alert({
            buttons: [{
              onPress: async () => firebase.messaging().requestPermission(),
              text: 'Okay',
            }, {
              onPress: () => console.log('Push notification dismissed'),
              style: 'cancel',
              text: 'Dismiss',
            }],
            message: lang.t('wallet.push_notifications.please_enable_body'),
            title: lang.t('wallet.push_notifications.please_enable_title'),
          });
        } catch (error) {
          console.log('user has rejected notifications');
        }
      }

      return addWalletConnector(walletConnector);
    } catch (error) {
      console.log('error initializing wallet connect', error);
      return Alert({
        message: error,
        title: lang.t('wallet.wallet_connect.error'),
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
