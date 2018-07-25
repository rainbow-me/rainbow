import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { walletConnectInit } from '../model/walletconnect';
import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    navigation: PropTypes.object,
  }

  handleScannerRef = (ref) => { this.qrCodeScanner = ref; }

  onSuccess = async (event) => {
    const { accountAddress, navigation } = this.props;
    const data = JSON.parse(event.data);

    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      try {
        await walletConnectInit(accountAddress, data.domain, data.sessionId, data.sharedKey, data.dappName);
        navigation.navigate('WalletScreen');
      } catch (error) {
        // TODO error handling
        console.log('error initializing wallet connect', error);
        setTimeout(() => this.qrCodeScanner.reactivate(), 1000);
      }
    } else {
      setTimeout(() => this.qrCodeScanner.reactivate(), 1000);
    }
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      scannerRef={this.handleScannerRef}
      onSuccess={this.onSuccess}
    />
  )
}

const reduxProps = ({ account: { accountAddress } }) => ({ accountAddress });
export default connect(reduxProps, null)(QRScannerScreenWithData);
