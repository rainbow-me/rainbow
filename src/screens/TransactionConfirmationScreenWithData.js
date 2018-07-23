import { get } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StatusBar, AlertIOS } from 'react-native';
import { connect } from 'react-redux';
import { sendTransaction } from '../model/wallet';
import { walletConnectSendTransactionHash } from '../model/walletconnect';
import { getTransactionToApprove } from '../reducers/transactionsToApprove';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    getTransactionToApprove: PropTypes.func,
    navigation: PropTypes.any,
  }

  state = {
    transactionDetails: null,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    this.showNewTransaction();
  }

  handleConfirmTransaction = async () => {
    try {
      const { transactionDetails } = this.state;
      const transactionReceipt = await sendTransaction(transactionDetails.transactionPayload, 'Confirm transaction' );
      if (transactionReceipt && transactionReceipt.hash) {
        try {
          await walletConnectSendTransactionHash(transactionDetails.transactionId, true, transactionReceipt.hash);
          // TODO: update that this transaction has been confirmed and reset txn details
          this.handleCancelTransaction();
        } catch(error) {
          // TODO error handling when txn hash failed to send; store somewhere?
          console.log('error sending txn hash', error);
          this.handleCancelTransaction();
        }
      } else {
        // TODO try catch
        await walletConnectSendTransactionHash(false, null);
        this.handleCancelTransaction();
      }
    } catch (error) {
      console.log('confirm send txn error', error);
      AlertIOS.alert('Authentication Failed');
    }
  };

  handleCancelTransaction = () => {
    console.log('onCancelTransaction', this.props);
    StatusBar.setBarStyle('dark-content', true);
    this.setState(() => ({ transactionDetails: null }));
    this.props.navigation.goBack();
  }

  showNewTransaction = () => {
    const transactionDetails = this.props.getTransactionToApprove();
    this.setState({ transactionDetails });
  }

  render = () => (
    <TransactionConfirmationScreen
      asset={{
        address: `${get(this.state.transactionDetails, 'transactionDisplayDetails.to', '')}`,
        amount: `${get(this.state.transactionDetails, 'transactionDisplayDetails.value', '')}`,
        name: `${get(this.state.transactionDetails, 'transactionDisplayDetails.name', '')}`,
        nativeAmount: '',
        symbol: `${get(this.state.transactionDetails, 'transactionDisplayDetails.symbol', '')}`,
      }}
      onCancelTransaction={this.handleCancelTransaction}
      onConfirmTransaction={this.handleConfirmTransaction}
    />
  )
}

export default connect(
  ({ transactionsToApprove: { transactionsToApprove } }) => ({ transactionsToApprove }),
  { getTransactionToApprove },
)(TransactionConfirmationScreenWithData);
