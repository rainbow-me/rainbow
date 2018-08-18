import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertIOS } from 'react-native';
import { connect } from 'react-redux';
import { walletConnectInit } from '../model/walletconnect';
import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    isScreenActive: PropTypes.bool,
    navigation: PropTypes.object,
  }

  shouldComponentUpdate = ({ isScreenActive, ...nextProps }) => {
    if (this.qrCodeScannerRef) {
      const isDisabled = this.qrCodeScannerRef.state.disablingByUser;

      if (isScreenActive && isDisabled && typeof this.qrCodeScannerRef.enable === 'function') {
        console.log('📠✅ Enabling QR Code Scanner');
        this.qrCodeScannerRef.enable();
      } else if (!isScreenActive && !isDisabled && typeof this.qrCodeScannerRef.disable === 'function') {
        console.log('📠🚫 Disabling QR Code Scanner');
        this.qrCodeScannerRef.disable();
      }
    }

    return nextProps === omit(this.props, 'isScreenActive');
  }

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
      }
    }
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      scannerRef={(ref) => { this.qrCodeScannerRef = ref; }}
      onSuccess={this.onSuccess}
    />
  )
}

const reduxProps = ({ account: { accountAddress } }) => ({ accountAddress });
export default connect(reduxProps, null)(QRScannerScreenWithData);
