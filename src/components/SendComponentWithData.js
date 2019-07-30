import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'recompact';
import { get } from 'lodash';
import lang from '../languages';
import { withAccountData, withUniqueTokens } from '../hoc';
import {
  sendClearFields,
  sendMaxBalance,
  sendModalInit,
  sendToggleConfirmationView,
  sendTransaction,
  sendUpdateAssetAmount,
  sendUpdateGasPrice,
  sendUpdateNativeAmount,
  sendUpdateRecipient,
  sendUpdateSelected,
} from '../redux/send';
import { isValidAddress } from '../helpers/validators';
import { greaterThan } from '../helpers/utilities';
import { ethereumUtils } from '../utils';

const mapStateToProps = ({ send, settings }) => ({
  accountType: settings.accountType,
  address: send.address,
  assetAmount: send.assetAmount,
  confirm: send.confirm,
  fetching: send.fetching,
  gasLimit: send.gasLimit,
  gasPrice: send.gasPrice,
  gasPriceOption: send.gasPriceOption,
  gasPrices: send.gasPrices,
  isSufficientBalance: send.isSufficientBalance,
  isSufficientGas: send.isSufficientGas,
  nativeAmount: send.nativeAmount,
  nativeCurrency: settings.nativeCurrency,
  network: settings.network,
  recipient: send.recipient,
  selected: send.selected,
  txHash: send.txHash,
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
      accountType: PropTypes.string.isRequired,
      address: PropTypes.string,
      assetAmount: PropTypes.string.isRequired,
      assets: PropTypes.array.isRequired,
      confirm: PropTypes.bool.isRequired,
      fetching: PropTypes.bool.isRequired,
      gasLimit: PropTypes.number.isRequired,
      gasPrice: PropTypes.object.isRequired,
      gasPriceOption: PropTypes.string.isRequired,
      gasPrices: PropTypes.object.isRequired,
      isSufficientBalance: PropTypes.bool.isRequired,
      isSufficientGas: PropTypes.bool.isRequired,
      nativeAmount: PropTypes.string.isRequired,
      nativeCurrency: PropTypes.string.isRequired,
      network: PropTypes.string.isRequired,
      recipient: PropTypes.string.isRequired,
      selected: PropTypes.object.isRequired,
      sendClearFields: PropTypes.func.isRequired,
      sendMaxBalance: PropTypes.func.isRequired,
      sendModalInit: PropTypes.func.isRequired,
      sendToggleConfirmationView: PropTypes.func.isRequired,
      sendTransaction: PropTypes.func.isRequired,
      sendUpdateAssetAmount: PropTypes.func.isRequired,
      sendUpdateGasPrice: PropTypes.func.isRequired,
      sendUpdateNativeAmount: PropTypes.func.isRequired,
      sendUpdateRecipient: PropTypes.func.isRequired,
      sendUpdateSelected: PropTypes.func.isRequired,
      txHash: PropTypes.string.isRequired,
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
        if ((selected.symbol !== prevProps.selected.symbol)
          || (recipient !== prevProps.recipient)
          || (assetAmount !== prevProps.assetAmount)) {
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
        const isAddressValid = await isValidAddress(this.props.recipient);
        if (!isAddressValid) {
          console.log(lang.t('notification.error.invalid_address'));
          return;
        }
        if (this.props.selected.address === 'eth') {
          const { requestedAmount, balance, amountWithFees } = ethereumUtils.transactionData(
            this.props.assets,
            this.props.assetAmount,
            this.props.gasPrice,
          );

          if (greaterThan(requestedAmount, balance)) {
            return;
          }
          if (greaterThan(amountWithFees, balance)) {
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
          }
          if (greaterThan(txFee, balance)) {
            return;
          }
        }

        this.props.sendToggleConfirmationView(true);

        return this.props.sendTransaction({
          address: this.props.address,
          amount: this.props.assetAmount,
          asset: this.props.selected,
          gasLimit: this.props.gasLimit,
          gasPrice: this.props.gasPrice,
          recipient: this.props.recipient,
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
    toggleQRCodeReader = () => this.setState({ showQRCodeReader: !this.state.showQRCodeReader });

    onQRCodeValidate = async (rawData) => {
      const data = rawData.match(/0x\w{40}/g)
        ? rawData.match(/0x\w{40}/g)[0]
        : null;
      let result = false;
      if (data) {
        result = await isValidAddress(data);
      }
      const onError = () => console.log(lang.t('notification.error.invalid_address_scanned'));
      return { data, onError, result };
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
    }
  }

  return compose(
    connect(mapStateToProps, {
      sendClearFields,
      sendMaxBalance,
      sendModalInit,
      sendToggleConfirmationView,
      sendTransaction,
      sendUpdateAssetAmount,
      sendUpdateGasPrice,
      sendUpdateNativeAmount,
      sendUpdateRecipient,
      sendUpdateSelected,
    }),
    withAccountData,
    withUniqueTokens,
  )(SendComponentWithData);
};
