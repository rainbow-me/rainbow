import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { compose } from 'recompact';
import { AlertIOS } from 'react-native';
import { withAccountAddress, withWalletConnectors } from '../hoc';
import { walletConnectInit } from '../model/walletconnect';
import QRScannerScreen from './QRScannerScreen';

class QRScannerScreenWithData extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    isScreenActive: PropTypes.bool,
    navigation: PropTypes.object,
  }

  handlePressBackButton = () => this.props.navigation.goBack()

  handleSuccess = async (event) => {
    const { accountAddress, navigation } = this.props;
    const data = JSON.parse(event.data);

    if (data.domain && data.sessionId && data.sharedKey && data.dappName) {
      try {
        await walletConnectInit(accountAddress, data.domain, data.sessionId, data.sharedKey, data.dappName);
        navigation.navigate('WalletScreen');
      } catch (error) {
        AlertIOS.alert(lang.t('wallet.wallet_connect.error'), error);
        console.log('error initializing wallet connect', error);
      }
    }
  }

  render = () => (
    <QRScannerScreen
      {...this.props}
      onPressBackButton={this.handlePressBackButton}
      onSuccess={this.handleSuccess}
    />
  )
}

export default compose(
  withAccountAddress,
  withWalletConnectors,
)(QRScannerScreenWithData);
