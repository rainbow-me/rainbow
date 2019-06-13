import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'recompact';
import { get } from 'lodash';
import lang from '../languages';
import { withAccountData, withUniqueTokens } from '../hoc';
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
} from '../redux/send';
import { isValidAddress } from '../helpers/validators';
import { greaterThan } from '../helpers/utilities';
import { ethereumUtils } from '../utils';

const mapStateToProps = ({ send, settings }) => ({
  address: settings.accountAddress,
  fetching: send.fetching,
  recipient: send.recipient,
  nativeAmount: send.nativeAmount,
  assetAmount: send.assetAmount,
  isSufficientGas: send.isSufficientGas,
  isSufficientBalance: send.isSufficientBalance,
  txHash: send.txHash,
  address: send.address,
  selected: send.selected,
  gasPrices: send.gasPrices,
  gasPrice: send.gasPrice,
  gasLimit: send.gasLimit,
  gasPriceOption: send.gasPriceOption,
  confirm: send.confirm,
  accountType: settings.accountType,
  network: settings.network,
  nativeCurrency: settings.nativeCurrency,
});

/**
 * Create SendComponent connected to redux with actions for sending assets.
 * @param  {Component}  SendComponent                     React component for sending.
 * @param  {Object}     options
 *         {Function}   options.sendTransactionCallback   Function to be run after sendTransaction redux action.
 *         {String}     options.defaultAsset              Symbol for default asset to send.
 * @return {Component}                                    SendComponent connected to redux.
 */
export const withSendComponentWithData = (SendComponent, options) => {
  class SendComponentWithData extends Component {
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
      fetching: PropTypes.bool.isRequired,
      recipient: PropTypes.string.isRequired,
      nativeAmount: PropTypes.string.isRequired,
      assetAmount: PropTypes.string.isRequired,
      isSufficientGas: PropTypes.bool.isRequired,
      isSufficientBalance: PropTypes.bool.isRequired,
      txHash: PropTypes.string.isRequired,
      selected: PropTypes.object.isRequired,
      gasPrice: PropTypes.object.isRequired,
      gasPrices: PropTypes.object.isRequired,
      gasLimit: PropTypes.number.isRequired,
      gasPriceOption: PropTypes.string.isRequired,
      confirm: PropTypes.bool.isRequired,
      assets: PropTypes.array.isRequired,
      accountType: PropTypes.string.isRequired,
      network: PropTypes.string.isRequired,
      nativeCurrency: PropTypes.string.isRequired,
    };

    constructor(props) {
      super(props);

      this.state = {
        isValidAddress: false,
        showQRCodeReader: false,
      };

      this.defaultAsset = options.defaultAsset;
      this.gasFormat = options.gasFormat || 'long';
      this.sendTransactionCallback = options.sendTransactionCallback || function noop() {};
    }

    componentDidMount() {
      this.props.sendModalInit({ defaultAsset: this.defaultAsset, gasFormat: this.gasFormat });
    }

    async componentDidUpdate(prevProps) {
      const { assetAmount, recipient, selected } = this.props;

      if (recipient !== prevProps.recipient) {
        const validAddress = await isValidAddress(recipient);
        this.setState({ isValidAddress: validAddress });
      }

      if (this.state.isValidAddress) {
        if ((selected.symbol !== prevProps.selected.symbol) ||
           (recipient !== prevProps.recipient) ||
           (assetAmount !== prevProps.assetAmount)) {
          this.props.sendUpdateGasPrice();
        }
      }
    }

    onAddressInputFocus = async () => {
      const { recipient } = this.props;

      const validAddress = await isValidAddress(recipient);
      this.setState({ isValidAddress: validAddress });
    };

    onAddressInputBlur = async () => {
      const { recipient } = this.props;

      const validAddress = await isValidAddress(recipient);
      this.setState({ isValidAddress: validAddress });
    };

    onGoBack = () => this.props.sendToggleConfirmationView(false);

    onSendMaxBalance = () => this.props.sendMaxBalance();

    onSendAnother = () => {
      this.props.sendToggleConfirmationView(false);
      this.props.sendClearFields();
      this.props.sendModalInit({ defaultAsset: this.defaultAsset });
    };

    onSubmit = async (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      if (!this.props.gasPrice.txFee) {
        return;
      }

      // Balance checks
      if (!this.props.confirm) {
        const { assets, assetAmount, gasPrice } = this.props;
        const isAddressValid = await isValidAddress(this.props.recipient);
        if (!isAddressValid) {
          console.log(lang.t('notification.error.invalid_address'));
          return;
        } else if (this.props.selected.address === 'eth') {
          const { requestedAmount, balance, amountWithFees } = ethereumUtils.transactionData(
            this.props.assets,
            this.props.assetAmount,
            this.props.gasPrice,
          );

          if (greaterThan(requestedAmount, balance)) {
            return;
          } else if (greaterThan(amountWithFees, balance)) {
            return;
          }
        } else if (!this.props.selected.isNft) {
          const { requestedAmount, balance, txFee } = ethereumUtils.transactionData(
            this.props.assets,
            this.props.assetAmount,
            this.props.gasPrice,
          );

          const tokenBalance = get(this.props, 'selected.balance.amount');

          if (greaterThan(requestedAmount, tokenBalance)) {
            return;
          } else if (greaterThan(txFee, balance)) {
            return;
          }
        }

        this.props.sendToggleConfirmationView(true);

        return this.props.sendTransaction({
          address: this.props.address,
          recipient: this.props.recipient,
          amount: this.props.assetAmount,
          asset: this.props.selected,
          gasPrice: this.props.gasPrice,
          gasLimit: this.props.gasLimit,
        }, this.sendTransactionCallback);
      }

    };

    updateGasPrice = gasPrice => {
      this.props.sendUpdateGasPrice(gasPrice);
    };

    onClose = () => {
      this.props.sendClearFields();
    };

    updateGasPrice = gasPrice => {
      this.props.sendUpdateGasPrice(gasPrice);
    };

    // QR Code Reader Handlers
    toggleQRCodeReader = () =>
      this.setState({ showQRCodeReader: !this.state.showQRCodeReader });

    onQRCodeValidate = async (rawData) => {
      const data = rawData.match(/0x\w{40}/g)
        ? rawData.match(/0x\w{40}/g)[0]
        : null;
      let result = false;
      if (data) {
        result = await isValidAddress(data);
      }
      const onError = () =>
        console.log(lang.t('notification.error.invalid_address_scanned'));
      return { data, result, onError };
    };

    onQRCodeScan = data => {
      this.props.sendUpdateRecipient(data);
      this.setState({ showQRCodeReader: false });
    };

    onQRCodeError = () => {
      console.log(lang.t('notification.error.failed_scanning_qr_code'));
    };

    render() {
      return (
        <SendComponent
          isValidAddress={this.state.isValidAddress}
          onSendMaxBalance={this.onSendMaxBalance}
          onAddressInputFocus={this.onAddressInputFocus}
          onAddressInputBlur={this.onAddressInputBlur}
          onClose={this.onClose}
          onQRCodeValidate={this.onQRCodeValidate}
          onQRCodeScan={this.onQRCodeScan}
          onQRCodeError={this.onQRCodeError}
          onSubmit={this.onSubmit}
          showQRCodeReader={this.state.showQRCodeReader}
          toggleQRCodeReader={this.toggleQRCodeReader}
          updateGasPrice={this.updateGasPrice}
          {...this.props}
        />
      );
    };
  }

  return compose(
    connect(mapStateToProps, {
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
    }),
    withAccountData,
    withUniqueTokens,
  )(SendComponentWithData);
};
