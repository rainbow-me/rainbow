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
    setSafeTimeout(this.handleReenableScanning, 1000);
    Vibration.vibrate();

    const parts = data.split(':');
    const address =
      (parts[0] === 'ethereum' && isValidAddress(parts[1])) ?
        parts[1] : isValidAddress(parts[0]) ?
          parts[0] : null;

    if (address) {
      return navigation.navigate('SendScreen', { address });
    }

    if (data.startsWith('ethereum:wc')) {
      const walletConnector = await walletConnectInit(
        accountAddress,
        data
      );
      await this.checkPushNotificationPermissions();
      return addWalletConnector(walletConnector);
    } else {
      return Alert({
        message: lang.t('wallet.unrecognized_qrcode'),
        title: lang.t('wallet.unrecognized_qrcode_title'),
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
