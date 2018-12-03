import { web3Instance } from 'balance-common';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import Piwik from 'react-native-matomo';
import { withMessageSigningScreen } from '../hoc';
import { signMessage } from '../model/wallet';
import { walletConnectSendStatus } from '../model/walletconnect';
import MessageSigningScreen from './MessageSigningScreen';

class MessageSigningScreenWithData extends Component {
  static propTypes = {
    accountUpdateTransactions: PropTypes.func,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
    walletConnectors: PropTypes.object,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    Vibration.vibrate();
  }

  handleSignMessage = async () => {
    // TODO: add a name, value?
    Piwik.trackEvent('Send', 'confirm-wc');
    const { transactionDetails } = this.props.navigation.state.params;
    const message = get(transactionDetails, 'transactionDisplayDetails.message');
    const flatFormatSignature = await signMessage(message);

    if (flatFormatSignature) {
      const txDetails = { message };
      //this.props.accountUpdateTransactions(txDetails); // TODO: how to display transactions for signed message
      this.props.removeTransaction(transactionDetails.callId);
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendStatus(walletConnector, transactionDetails.callId, flatFormatSignature);
      this.closeScreen();
    } else {
      await this.handleCancelSignMessage();
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      this.closeScreen();
      const { transactionDetails } = this.props.navigation.state.params;
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendStatus(walletConnector, transactionDetails.callId, null);
    } catch (error) {
      this.closeScreen();
      AlertIOS.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelSignMessage = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.callId);
    } catch (error) {
      this.closeScreen();
      AlertIOS.alert('Failed to send rejected transaction status');
    }
  }

  closeScreen = () => {
    StatusBar.setBarStyle('dark-content', true);
    this.props.navigation.goBack();
  }

  render = () => {
    const {
      transactionDetails: {
        transactionDisplayDetails: {
          message
        },
        dappName,
      },
    } = this.props.navigation.state.params;
    return (
      <MessageSigningScreen
        dappName={dappName}
        message={message}
        onCancelSignMessage={this.handleCancelSignMessage}
        onSignMessage={this.handleSignMessage}
      />
    );
  }
}

export default withMessageSigningScreen(MessageSigningScreenWithData);
