import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { Transition } from 'react-navigation-fluid-transitions';
import { Page } from '../components/layout';
import { walletConnectInit } from '../model/walletconnect';
import { connect } from 'react-redux';
import { colors } from '../styles';

import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    navigation: PropTypes.object,
    accountAddress: PropTypes.string
  }

  onSuccess = async e => {
    const data = JSON.parse(e.data);
    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      try {
        await walletConnectInit(this.props.accountAddress, data.domain, data.sessionId, data.sharedKey, data.dappName);
        this.props.navigation.navigate('WalletScreen');
      } catch (error) {
        // TODO error handling
        console.log('error initializing wallet connect', error);
        setTimeout(() => {
          this.qrCodeScanner.reactivate();
        }, 1000);
      }
    } else {
      setTimeout(() => {
        this.qrCodeScanner.reactivate();
      }, 1000);
    }

  }

  // static navigatorStyle = {
  //   navBarHidden: true,
  //   statusBarTextColorScheme: 'light',
  // }

  handleScannerRef = (ref) => { this.qrCodeScanner = ref; }

  render() {
    return (
        <QRScannerScreen
          {...this.props}
          onSuccess={this.onSuccess}
          scannerRef={this.handleScannerRef}
        />
    );
  }
}

const reduxProps = ({ account }) => ({
  accountAddress: account.accountAddress,
});

export default connect(reduxProps, null)(QRScannerScreenWithData);
