import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Vibration } from 'react-native';
import firebase from 'react-native-firebase';
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
    requestingNotificationPermissionAlert: false,
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
    }
  }

  handleSheetLayout = ({ nativeEvent }) => {
    this.setState({ sheetHeight: get(nativeEvent, 'layout.height') });
  }

  handlePressBackButton = () => this.props.navigation.navigate('WalletScreen')

  handleReenableScanning = () => this.setState({ enableScanning: true })

  handleReenableScanningWithPushPermissions = () => this.setState({
    enableScanning: true,
    requestingNotificationPermissionAlert: false,
  });

  checkPushNotificationPermissions = async () => {
    const arePushNotificationsAuthorized = await firebase
      .messaging()
      .hasPermission();

    if (!arePushNotificationsAuthorized) {
      this.setState({ requestingNotificationPermissionAlert: true });
      Alert({
        buttons: [{
          onPress: async () => {
            try {
              await firebase.messaging().requestPermission();
              this.handleReenableScanningWithPushPermissions();
            } catch (error) {
              this.handleReenableScanningWithPushPermissions();
            }
          },
          text: 'Okay',
        }, {
          onPress: () => this.handleReenableScanningWithPushPermissions(),
          style: 'cancel',
          text: 'Dismiss',
        }],
        message: lang.t('wallet.push_notifications.please_enable_body'),
        title: lang.t('wallet.push_notifications.please_enable_title'),
      });
      return false;
    } else {
      return true;
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
      navigation.navigate('WalletScreen');
      navigation.navigate('SendSheet', { address });
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    if (data.startsWith('ethereum:wc')) {
      const walletConnector = await walletConnectInit(accountAddress, data);
      addWalletConnector(walletConnector);
      const hasPushPermissions = await this.checkPushNotificationPermissions();
      if (hasPushPermissions) {
        return setSafeTimeout(this.handleReenableScanning, 2000);
      } else {
        return;
      }
    }

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
      enableScanning={
        this.state.enableScanning
        && this.props.isFocused
        && !this.state.requestingNotificationPermissionAlert
      }
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
