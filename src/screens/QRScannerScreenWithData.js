import { isValidAddress } from 'balance-common';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
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
      onPressBackButton={this.handlePressBackButton}
      onScanSuccess={this.handleScanSuccess}
    />
  )
}

export default compose(
  withAccountAddress,
  withAddWalletConnector,
)(QRScannerScreenWithData);
