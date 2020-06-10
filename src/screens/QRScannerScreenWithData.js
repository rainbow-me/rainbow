import { withSafeTimeout } from '@hocs/safe-timers';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Alert as NativeAlert, Platform, Vibration } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import { PERMISSIONS, request } from 'react-native-permissions';
import { withNavigationFocus } from 'react-navigation';
import { connect } from 'react-redux';
import { compose } from 'recompact';
import { Alert, Prompt } from '../components/alerts';
import WalletTypes from '../helpers/walletTypes';
import {
  withWalletConnectConnections,
  withWalletConnectOnSessionRequest,
} from '../hoc';
import { checkPushNotificationPermissions } from '../model/firebase';
import store from '../redux/store';
import { addressUtils } from '../utils';
import QRScannerScreen from './QRScannerScreen';
import Routes from './Routes/routesNames';

class QRScannerScreenWithData extends Component {
  static propTypes = {
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

  handlePressBackButton = () =>
    this.props.navigation.navigate(Routes.WALLET_SCREEN);

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

    const { selected } = store.getState().wallets;
    const selectedWallet = selected || {};

    const isReadOnlyWallet = selectedWallet.type === WalletTypes.readOnly;

    if (!data) return null;
    this.setState({ enableScanning: false });
    if (!isEmulatorSync()) {
      Vibration.vibrate();
    }

    const address = await addressUtils.getEthereumAddressFromQRCodeData(data);

    if (address) {
      if (isReadOnlyWallet) {
        NativeAlert.alert(`You need to import the wallet in order to do this`);
        return null;
      }

      analytics.track('Scanned address QR code');
      navigation.navigate(Routes.WALLET_SCREEN);
      navigation.navigate(Routes.SEND_SHEET, { address });
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    if (data.startsWith('wc:')) {
      analytics.track('Scanned WalletConnect QR code');
      await walletConnectOnSessionRequest(data, async () => {
        setTimeout(() => {
          checkPushNotificationPermissions();
        }, 1000);
      });
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

const mapStateToProps = ({ modal: { visible: modalVisible } }) => ({
  modalVisible,
});

export default compose(
  withNavigationFocus,
  withWalletConnectOnSessionRequest,
  withSafeTimeout,
  connect(mapStateToProps),
  withWalletConnectConnections
)(QRScannerScreenWithData);
