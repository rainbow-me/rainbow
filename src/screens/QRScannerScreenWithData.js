import { isValidAddress } from 'balance-common';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Alert, AlertIOS } from 'react-native';
import firebase from 'react-native-firebase';
import { compose } from 'recompact';
import { withAccountAddress, withAddWalletConnector } from '../hoc';
import { walletConnectInit } from '../model/walletconnect';
import QRScannerScreen from './QRScannerScreen';

const requestNotificationPermissionAlert = () =>
  Alert.alert(
    lang.t('wallet.push_notifications.please_enable_title'),
    lang.t('wallet.push_notifications.please_enable_body'),
    [
      {
        onPress: async () => firebase.messaging().requestPermission(),
        text: 'Okay',
      }, {
        onPress: () => console.log('Push notification dismissed'),
        style: 'cancel',
        text: 'Dismiss',
      },
    ],
    { cancelable: false },
  );

class QRScannerScreenWithData extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    addWalletConnector: PropTypes.func,
    navigation: PropTypes.object,
  }

  handlePressBackButton = () => this.props.navigation.push('WalletScreen')

  handleScanSuccess = async ({ data }) => {
    const { accountAddress, addWalletConnector, navigation } = this.props;

    if (!data) return null;

    const parts = data.split(':');

    if (isValidAddress(parts[1])) {
      return navigation.navigate('SendScreen', { address: parts[1] });
    }

    try {
      const walletConnector = await walletConnectInit(accountAddress, data);
      const arePushNotificationsAuthorized = await firebase.messaging().hasPermission();

      if (!arePushNotificationsAuthorized) {
        try {
          requestNotificationPermissionAlert();
        } catch (error) {
          console.log('user has rejected notifications');
        }
      }

      return addWalletConnector(walletConnector);
    } catch (error) {
      console.log('error initializing wallet connect', error);
      return AlertIOS.alert(lang.t('wallet.wallet_connect.error'), error);
    }
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleScanSuccess}
    />
  )
}

export default compose(
  withAccountAddress,
  withAddWalletConnector,
)(QRScannerScreenWithData);
