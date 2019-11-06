import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompact';
import { estimateGasLimit } from '../handlers/web3';
import { greaterThan } from '../helpers/utilities';
import { checkIsValidAddress } from '../helpers/validators';
import { withAccountData, withGas, withUniqueTokens } from '../hoc';
import lang from '../languages';
import {
  sendClearFields,
  sendMaxBalance,
  sendModalInit,
  sendToggleConfirmationView,
  sendTransaction,
  sendUpdateAssetAmount,
  sendUpdateNativeAmount,
  sendUpdateRecipient,
  sendUpdateSelected,
} from '../redux/send';
import { ethereumUtils } from '../utils';

const mapStateToProps = ({ send, settings }) => ({
  accountType: settings.accountType,
  address: send.address,
  assetAmount: send.assetAmount,
  confirm: send.confirm,
  fetching: send.fetching,
  isSufficientBalance: send.isSufficientBalance,
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
      gasLimit: PropTypes.number,
      gasPrices: PropTypes.object.isRequired,
      gasUpdateDefaultGasLimit: PropTypes.func.isRequired,
      gasUpdateTxFee: PropTypes.func.isRequired,
      isSufficientBalance: PropTypes.bool.isRequired,
      isSufficientGas: PropTypes.bool.isRequired,
      nativeAmount: PropTypes.string.isRequired,
      nativeCurrency: PropTypes.string.isRequired,
      network: PropTypes.string.isRequired,
      recipient: PropTypes.string.isRequired,
      selected: PropTypes.object.isRequired,
      selectedGasPrice: PropTypes.shape({ txFee: PropTypes.object }),
      selectedGasPriceOption: PropTypes.string.isRequired,
      sendClearFields: PropTypes.func.isRequired,
      sendMaxBalance: PropTypes.func.isRequired,
      sendModalInit: PropTypes.func.isRequired,
      sendToggleConfirmationView: PropTypes.func.isRequired,
      sendTransaction: PropTypes.func.isRequired,
      sendUpdateAssetAmount: PropTypes.func.isRequired,
      sendUpdateNativeAmount: PropTypes.func.isRequired,
      sendUpdateRecipient: PropTypes.func.isRequired,
      sendUpdateSelected: PropTypes.func.isRequired,
      txFees: PropTypes.object.isRequired,
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
      this.sendTransactionCallback =
        options.sendTransactionCallback || function noop() {};
    }

    componentDidMount() {
      this.props.sendModalInit({
        defaultAsset: this.defaultAsset,
        gasFormat: this.gasFormat,
      });
      this.props.gasUpdateDefaultGasLimit();
    }

    async componentDidUpdate(prevProps) {
      const { address, assetAmount, recipient, selected } = this.props;

      if (recipient !== prevProps.recipient) {
        const validAddress = await checkIsValidAddress(recipient);
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ isValidAddress: validAddress });
      }

      if (this.state.isValidAddress) {
        if (
          selected.symbol !== prevProps.selected.symbol ||
          recipient !== prevProps.recipient ||
          assetAmount !== prevProps.assetAmount
        ) {
          estimateGasLimit({
            address,
            amount: assetAmount,
            asset: selected,
            recipient,
          })
            .then(gasLimit => {
              this.props.gasUpdateTxFee(gasLimit);
            })
            .catch(() => {
              this.props.gasUpdateTxFee();
            });
        }
      }
    }

    onAddressInputFocus = async () => {
      const { recipient } = this.props;

      const validAddress = await checkIsValidAddress(recipient);
      this.setState({ isValidAddress: validAddress });
    };

    onAddressInputBlur = async () => {
      const { recipient } = this.props;

      const validAddress = await checkIsValidAddress(recipient);
      this.setState({ isValidAddress: validAddress });
    };

    onGoBack = () => this.props.sendToggleConfirmationView(false);

    onSendMaxBalance = () => this.props.sendMaxBalance();

    onSendAnother = () => {
      this.props.sendToggleConfirmationView(false);
      this.props.sendClearFields();
      this.props.sendModalInit({ defaultAsset: this.defaultAsset });
    };

    onSubmit = async event => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      if (!this.props.selectedGasPrice.txFee) {
        return;
      }

      // Balance checks
      if (!this.props.confirm) {
        const isAddressValid = await checkIsValidAddress(this.props.recipient);
        if (!isAddressValid) {
          console.log(lang.t('notification.error.invalid_address'));
          return;
        }
        if (this.props.selected.address === 'eth') {
          const {
            requestedAmount,
            balance,
            amountWithFees,
          } = ethereumUtils.transactionData(
            this.props.assets,
            this.props.assetAmount,
            this.props.selectedGasPrice
          );

          if (greaterThan(requestedAmount, balance)) {
            return;
          }
          if (greaterThan(amountWithFees, balance)) {
            return;
          }
        } else if (!this.props.selected.isNft) {
          const {
            requestedAmount,
            balance,
            txFee,
          } = ethereumUtils.transactionData(
            this.props.assets,
            this.props.assetAmount,
            this.props.selectedGasPrice
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

        return this.props.sendTransaction(
          {
            address: this.props.address,
            amount: this.props.assetAmount,
            asset: this.props.selected,
            gasLimit: this.props.gasLimit,
            gasPrice: this.props.selectedGasPrice,
            recipient: this.props.recipient,
          },
          this.sendTransactionCallback
        );
      }
    };

    onClose = () => {
      this.props.sendClearFields();
    };

    // QR Code Reader Handlers
    toggleQRCodeReader = () =>
      this.setState(prevState => ({
        showQRCodeReader: !prevState.showQRCodeReader,
      }));

    onQRCodeValidate = async rawData => {
      const data = rawData.match(/0x\w{40}/g)
        ? rawData.match(/0x\w{40}/g)[0]
        : null;
      let result = false;
      if (data) {
        result = await checkIsValidAddress(data);
      }
      const onError = () =>
        console.log(lang.t('notification.error.invalid_address_scanned'));
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
          {...this.props}
        />
      );
    }
  }

  return compose(
    connect(
      mapStateToProps,
      {
        sendClearFields,
        sendMaxBalance,
        sendModalInit,
        sendToggleConfirmationView,
        sendTransaction,
        sendUpdateAssetAmount,

        sendUpdateNativeAmount,
        sendUpdateRecipient,
        sendUpdateSelected,
      }
    ),
    withGas,
    withAccountData,
    withUniqueTokens
  )(SendComponentWithData);
};
