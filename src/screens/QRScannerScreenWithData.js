import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Vibration } from 'react-native';
import firebase from 'react-native-firebase';
import Permissions from 'react-native-permissions';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { withSafeTimeout } from '@hocs/safe-timers';
import { Alert } from '../components/alerts';
import { withAccountAddress, withWalletConnectOnSessionRequest } from '../hoc';
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
    requestingNotificationPermissionAlert: false,
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
      walletConnectOnSessionRequest,
      navigation,
      setSafeTimeout,
    } = this.props;

    if (!data) return null;

    console.log('QRCode scanned data', data);

    this.setState({ enableScanning: false });
    Vibration.vibrate();

    const address = await addressUtils.getEthereumAddressFromQRCodeData(data);

    if (address) {
      navigation.navigate('WalletScreen');
      navigation.navigate('SendSheet', { address });
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    if (data.startsWith('wc:')) {
      await walletConnectOnSessionRequest(data);
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
  withWalletConnectOnSessionRequest,
  withAccountAddress,
  withSafeTimeout,
  withWalletConnectConnections,
  withStatusBarStyle('light-content'),
)(QRScannerScreenWithData);
