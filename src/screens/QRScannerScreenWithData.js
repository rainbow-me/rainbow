import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { walletConnectInit } from '../model/walletconnect';
import QRScannerScreen from './QRScannerScreen';
import { AlertIOS } from 'react-native';

class QRScannerScreenWithData extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    isScreenActive: PropTypes.bool,
    isSwiping: PropTypes.bool,
    navigation: PropTypes.object,
  }

  scannerReactivationTimeout = null

  componentWillUnmount = () => {
    if (this.scannerReactivationTimeout) {
      clearTimeout(this.scannerReactivationTimeout);
      this.scannerReactivationTimeout = 0;
    }
  }

  handleScannerReactivation = () => {
    this.scannerReactivationTimeout = setTimeout(() => {
      console.log('resetting qr scanner');
      this.qrCodeScannerRef.reactivate();
    }, 1000);
  }

  handleScannerRef = (ref) => { this.qrCodeScannerRef = ref; }

  onSuccess = async (event) => {
    const { accountAddress, navigation } = this.props;
    const data = JSON.parse(event.data);

    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      try {
        await walletConnectInit(accountAddress, data.domain, data.sessionId, data.sharedKey, data.dappName);
        navigation.navigate('WalletScreen');
      } catch (error) {
        AlertIOS.alert('Error initializing with WalletConnect', error);
        console.log('error initializing wallet connect', error);
        this.handleScannerReactivation();
      }
    } else {
      this.handleScannerReactivation();
    }
  }

  render = () => {
    const { isScreenActive, isSwiping, ...props } = this.props;

    if (this.qrCodeScannerRef) {
      const isDisabled = this.qrCodeScannerRef.state.disablingByUser;

      if (isScreenActive && isDisabled && !isSwiping) {
        this.qrCodeScannerRef.enable();
      } else if (!isDisabled) {
        this.qrCodeScannerRef.disable();
      }
    }

    return (
      <QRScannerScreen
        {...props}
        scannerRef={this.handleScannerRef}
        onSuccess={this.onSuccess}
      />
    );
  }
}

const reduxProps = ({ account: { accountAddress } }) => ({ accountAddress });
export default connect(reduxProps, null)(QRScannerScreenWithData);
