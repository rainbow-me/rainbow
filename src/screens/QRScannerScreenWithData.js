import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Vibration } from 'react-native';
import Piwik from 'react-native-matomo';
import { compose } from 'recompact';
import { Alert } from '../components/alerts';
import { withAccountAddress, withInitNewWalletConnector } from '../hoc';
import { getEthereumAddressFromQRCodeData } from '../utils';
import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    walletConnectInitNewSession: PropTypes.func,
    isScreenActive: PropTypes.bool,
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
  };

  state = { enableScanning: true };

  componentDidUpdate = (prevProps) => {
    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      this.setState({ enableScanning: true });
      Piwik.trackScreen('QRScannerScreen', 'QRScannerScreen');
    }
  }

  handlePressBackButton = () => this.props.navigation.navigate('WalletScreen')

  handleReenableScanning = () => this.setState({ enableScanning: true })

  handleScanSuccess = async ({ data }) => {
    const {
      accountAddress,
      walletConnectInitNewSession,
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
      await walletConnectInitNewSession(accountAddress, data);
      return setSafeTimeout(this.handleReenableScanning, 1000);
    }

    Piwik.trackEvent('QRScanner', 'unknown', 'QRScannedUnknown');
    return Alert({
      message: lang.t('wallet.unrecognized_qrcode'),
      title: lang.t('wallet.unrecognized_qrcode_title'),
      callback: this.handleReenableScanning,
    });
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
  withInitNewWalletConnector,
  withSafeTimeout,
)(QRScannerScreenWithData);
