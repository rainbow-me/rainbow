import React, { Component } from 'react';
import { Button, Image, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Section from '../components/Section';
import SendScreen from './SendScreen';
import { connect } from 'react-redux';
import {
  sendModalInit,
  sendUpdateGasPrice,
  sendTransaction,
  sendClearFields,
  sendUpdateRecipient,
  sendUpdateNativeAmount,
  sendUpdateAssetAmount,
  sendUpdateSelected,
  sendMaxBalance,
  sendToggleConfirmationView,
} from '../../reducers/_send';

class SendScreenWithData extends Component {
  static propTypes = {
    sendModalInit: PropTypes.func.isRequired,
    sendUpdateGasPrice: PropTypes.func.isRequired,
    sendTransaction: PropTypes.func.isRequired,
    sendClearFields: PropTypes.func.isRequired,
    sendUpdateRecipient: PropTypes.func.isRequired,
    sendUpdateNativeAmount: PropTypes.func.isRequired,
    sendUpdateAssetAmount: PropTypes.func.isRequired,
    sendUpdateSelected: PropTypes.func.isRequired,
    sendMaxBalance: PropTypes.func.isRequired,
    sendToggleConfirmationView: PropTypes.func.isRequired,
    notificationShow: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    recipient: PropTypes.string.isRequired,
    nativeAmount: PropTypes.string.isRequired,
    assetAmount: PropTypes.string.isRequired,
    txHash: PropTypes.string.isRequired,
    // address: PropTypes.string.isRequired,
    selected: PropTypes.object.isRequired,
    gasPrice: PropTypes.object.isRequired,
    gasPrices: PropTypes.object.isRequired,
    gasLimit: PropTypes.number.isRequired,
    gasPriceOption: PropTypes.string.isRequired,
    confirm: PropTypes.bool.isRequired,
    accountInfo: PropTypes.object.isRequired,
    accountType: PropTypes.string.isRequired,
    navigation: PropTypes.any,
    network: PropTypes.string.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
    prices: PropTypes.object.isRequired,
  };

  state = {
    isValidAddress: true,
    showQRCodeReader: false,
  };

  componentDidMount() {
    this.props.sendModalInit();
  }

  componentDidUpdate(prevProps) {
    if (this.props.recipient.length >= 42) {
      if (this.props.selected.symbol !== prevProps.selected.symbol) {
        this.props.sendUpdateGasPrice();
      } else if (this.props.recipient !== prevProps.recipient) {
        this.props.sendUpdateGasPrice();
      } else if (this.props.assetAmount !== prevProps.assetAmount) {
        this.props.sendUpdateGasPrice();
      }
    }
  }

  render = () => {
    return (
      <SendScreen /> // TODO pass on props
    );
  };
}

const reduxProps = ({ send, account }) => ({
  fetching: send.fetching,
  recipient: send.recipient,
  nativeAmount: send.nativeAmount,
  assetAmount: send.assetAmount,
  txHash: send.txHash,
  address: send.address,
  selected: send.selected,
  gasPrices: send.gasPrices,
  gasPrice: send.gasPrice,
  gasLimit: send.gasLimit,
  gasPriceOption: send.gasPriceOption,
  confirm: send.confirm,
  accountInfo: account.accountInfo,
  accountType: account.accountType,
  network: account.network,
  nativeCurrency: account.nativeCurrency,
  prices: account.prices,
});

export default connect(
  reduxProps,
  {
    sendModalInit,
    sendUpdateGasPrice,
    sendTransaction,
    sendClearFields,
    sendUpdateRecipient,
    sendUpdateNativeAmount,
    sendUpdateAssetAmount,
    sendUpdateSelected,
    sendMaxBalance,
    sendToggleConfirmationView,
    notificationShow,
  },
)(SendScreen);
