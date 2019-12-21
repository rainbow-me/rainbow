import analytics from '@segment/analytics-react-native';
import { get, isEmpty, isString, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendButton,
  SendContactList,
  SendHeader,
  SendTransactionSpeed,
} from '../components/send';
import { createSignableTransaction, estimateGasLimit } from '../handlers/web3';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
  greaterThan,
} from '../helpers/utilities';
import { checkIsValidAddress } from '../helpers/validators';
import lang from '../languages';
import { sendTransaction } from '../model/wallet';
import { borders, colors } from '../styles';
import {
  deviceUtils,
  ethereumUtils,
  gasUtils,
  isNewValueForPath,
} from '../utils';

const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', 16)};
  background-color: ${colors.white};
  height: 100%;
  top: ${statusBarHeight};
`;

export default class SendSheet extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    dataAddNewTransaction: PropTypes.func,
    fetchData: PropTypes.func,
    gasLimit: PropTypes.number,
    gasPrices: PropTypes.object,
    gasUpdateDefaultGasLimit: PropTypes.func.isRequired,
    gasUpdateTxFee: PropTypes.func.isRequired,
    isSufficientGas: PropTypes.bool.isRequired,
    nativeCurrencySymbol: PropTypes.string,
    navigation: PropTypes.object,
    removeContact: PropTypes.func,
    selectedGasPrice: PropTypes.object,
    sendableUniqueTokens: PropTypes.arrayOf(PropTypes.object),
    sortedContacts: PropTypes.array,
    txFees: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      assetAmount: '',
      confirm: false,
      currentInput: '',
      isAuthorizing: false,
      isSufficientBalance: false,
      isValidAddress: false,
      nativeAmount: '',
      recipient: '',
      selected: {},
    };
  }

  componentDidMount() {
    this.props.gasUpdateDefaultGasLimit();
  }

  async componentDidUpdate(prevProps, prevState) {
    const { accountAddress, contacts, navigation } = this.props;
    const { assetAmount, isValidAddress, recipient, selected } = this.state;
    if (isValidAddress && !prevState.isValidAddress) {
      Keyboard.dismiss();
    }

    const isNewSelected = isNewValueForPath(this.state, prevState, 'selected');
    const isNewValidAddress = isNewValueForPath(
      this.state,
      prevState,
      'isValidAddress'
    );
    const isNewContactList = isNewValueForPath(
      this.props,
      prevProps,
      'contacts'
    );

    if (isNewValidAddress || isNewSelected || isNewContactList) {
      let verticalGestureResponseDistance = 140;

      if (!isValidAddress && !isEmpty(contacts)) {
        verticalGestureResponseDistance = 140;
      } else if (isValidAddress) {
        verticalGestureResponseDistance = isEmpty(selected)
          ? 140
          : deviceUtils.dimensions.height;
      } else {
        verticalGestureResponseDistance = deviceUtils.dimensions.height;
      }

      navigation.setParams({ verticalGestureResponseDistance });
    }

    const assetOverride = get(navigation, 'state.params.asset');
    const recipientOverride = get(navigation, 'state.params.address');

    if (recipientOverride && !this.state.recipient) {
      this.sendUpdateRecipient(recipientOverride);
    }

    if (isValidAddress && !prevState.isValidAddress) {
      if (assetOverride) {
        this.sendUpdateSelected(assetOverride);
      }
    }

    const isNewRecipient = isNewValueForPath(
      this.state,
      prevState,
      'recipient'
    );
    if (isNewRecipient) {
      const validAddress = await checkIsValidAddress(recipient);
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isValidAddress: validAddress });
    }

    if (isValidAddress) {
      if (
        selected.symbol !== prevState.selected.symbol ||
        recipient !== prevState.recipient ||
        assetAmount !== prevState.assetAmount
      ) {
        estimateGasLimit({
          address: accountAddress,
          amount: assetAmount,
          asset: selected,
          recipient,
        })
          .then(gasLimit => {
            this.props.gasUpdateTxFee(gasLimit);
          })
          .catch(() => {
            this.props.gasUpdateTxFee(null);
          });
      }
    }
  }

  sendUpdateAssetAmount = assetAmount => {
    const { nativeCurrency, selectedGasPrice } = this.props;
    const { selected } = this.state;
    const _assetAmount = assetAmount.replace(/[^0-9.]/g, '');
    let _nativeAmount = '';
    if (_assetAmount.length) {
      const priceUnit = get(selected, 'price.value', 0);
      const { amount: nativeAmount } = convertAmountAndPriceToNativeDisplay(
        _assetAmount,
        priceUnit,
        nativeCurrency
      );
      _nativeAmount = formatInputDecimals(nativeAmount, _assetAmount);
    }
    const balanceAmount = ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      selected
    );
    this.setState({
      assetAmount: _assetAmount,
      isSufficientBalance: Number(_assetAmount) <= Number(balanceAmount),
      nativeAmount: _nativeAmount,
    });
  };

  onChangeNativeAmount = nativeAmount => {
    if (!isString(nativeAmount)) return;
    const { selected } = this.state;
    const { selectedGasPrice } = this.props;
    const _nativeAmount = nativeAmount.replace(/[^0-9.]/g, '');
    let _assetAmount = '';
    if (_nativeAmount.length) {
      const priceUnit = get(selected, 'price.value', 0);
      const assetAmount = convertAmountFromNativeValue(
        _nativeAmount,
        priceUnit,
        selected.decimals
      );
      _assetAmount = formatInputDecimals(assetAmount, _nativeAmount);
    }

    const balanceAmount = ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      selected
    );
    const isSufficientBalance = Number(_assetAmount) <= Number(balanceAmount);

    this.setState({
      assetAmount: _assetAmount,
      isSufficientBalance,
      nativeAmount: _nativeAmount,
    });
    analytics.track('Changed native currency input in Send flow');
  };

  sendMaxBalance = () => {
    const balanceAmount = ethereumUtils.getBalanceAmount(
      this.props.selectedGasPrice,
      this.state.selected
    );
    this.sendUpdateAssetAmount(balanceAmount);
  };

  onChangeAssetAmount = assetAmount => {
    if (isString(assetAmount)) {
      this.sendUpdateAssetAmount(assetAmount);
      analytics.track('Changed token input in Send flow');
    }
  };

  onLongPressSend = () => {
    this.setState({ isAuthorizing: true });

    if (isIphoneX()) {
      this.submitTransaction();
    } else {
      this.onPressTransactionSpeed(this.submitTransaction);
    }
  };

  onPressTransactionSpeed = onSuccess => {
    const { gasPrices, gasUpdateGasPriceOption, txFees } = this.props;
    gasUtils.showTransactionSpeedOptions(
      gasPrices,
      txFees,
      gasUpdateGasPriceOption,
      onSuccess
    );
  };

  onResetAssetSelection = () => {
    analytics.track('Reset asset selection in Send flow');
    this.sendUpdateSelected({});
  };

  submitTransaction = async () => {
    const { navigation } = this.props;
    const { assetAmount, recipient, selected } = this.state;

    if (Number(assetAmount) <= 0) return false;

    try {
      await this.onSubmit();
      this.setState({ isAuthorizing: false });
      analytics.track('Sent transaction', {
        assetName: selected.name,
        assetType: selected.isNft ? 'unique_token' : 'token',
        isRecepientENS: toLower(recipient.slice(-4)) === '.eth',
      });
      navigation.navigate('ProfileScreen');
    } catch {
      this.setState({ isAuthorizing: false });
    }
  };

  onChangeInput = event =>
    this.setState({ currentInput: event, recipient: event });

  sendUpdateRecipient = recipient => this.setState({ recipient });

  sendUpdateSelected = selected => {
    if (get(selected, 'isNft')) {
      this.setState({
        assetAmount: '1',
        isSufficientBalance: true,
        selected: {
          ...selected,
          symbol: get(selected, 'asset_contract.name'),
        },
      });
    } else {
      const assetAmount = this.state.assetAmount;
      this.setState({ selected });
      this.sendUpdateAssetAmount(assetAmount);
    }
  };

  onSubmit = async () => {
    const {
      accountAddress,
      assets,
      dataAddNewTransaction,
      gasLimit,
      selectedGasPrice,
    } = this.props;
    const { assetAmount, confirm, recipient, selected } = this.state;
    if (!selectedGasPrice.txFee) {
      return;
    }

    // Balance checks
    if (!confirm) {
      const isAddressValid = await checkIsValidAddress(recipient);
      if (!isAddressValid) {
        console.log(lang.t('notification.error.invalid_address'));
        return;
      }
      if (selected.address === 'eth') {
        const {
          requestedAmount,
          balance,
          amountWithFees,
        } = ethereumUtils.transactionData(
          assets,
          assetAmount,
          selectedGasPrice
        );

        if (greaterThan(requestedAmount, balance)) {
          return;
        }
        if (greaterThan(amountWithFees, balance)) {
          return;
        }
      } else if (!selected.isNft) {
        const {
          requestedAmount,
          balance,
          txFee,
        } = ethereumUtils.transactionData(
          assets,
          assetAmount,
          selectedGasPrice
        );

        const tokenBalance = get(selected, 'balance.amount');

        if (greaterThan(requestedAmount, tokenBalance)) {
          return;
        }
        if (greaterThan(txFee, balance)) {
          return;
        }
      }

      this.setState({ confirm: true });

      const txDetails = {
        amount: assetAmount,
        asset: selected,
        from: accountAddress,
        gasLimit,
        gasPrice: get(selectedGasPrice, 'value.amount'),
        nonce: null,
        to: recipient,
      };
      try {
        const signableTransaction = await createSignableTransaction(txDetails);
        const txHash = sendTransaction({
          transaction: signableTransaction,
        });
        if (!isEmpty(txHash)) {
          txDetails.hash = txHash;
          await dataAddNewTransaction(txDetails);
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
  };

  render() {
    const {
      allAssets,
      contacts,
      fetchData,
      isSufficientGas,
      nativeCurrencySymbol,
      removeContact,
      selectedGasPrice,
      sendableUniqueTokens,
      sortedContacts,
      ...props
    } = this.props;
    const {
      assetAmount,
      currentInput,
      isAuthorizing,
      isSufficientBalance,
      isValidAddress,
      nativeAmount,
      recipient,
      selected,
    } = this.state;
    const showEmptyState = !isValidAddress;
    const showAssetList = isValidAddress && isEmpty(selected);
    const showAssetForm = isValidAddress && !isEmpty(selected);

    return (
      <SheetContainer>
        <KeyboardAvoidingView behavior="padding">
          <Container align="center">
            <SendHeader
              contacts={contacts}
              isValidAddress={isValidAddress}
              onChangeAddressInput={this.onChangeInput}
              onPressPaste={this.sendUpdateRecipient}
              recipient={recipient}
              removeContact={removeContact}
            />
            {showEmptyState && (
              <SendContactList
                allAssets={sortedContacts}
                currentInput={currentInput}
                onPressContact={this.sendUpdateRecipient}
                removeContact={removeContact}
              />
            )}
            {showAssetList && (
              <SendAssetList
                allAssets={allAssets}
                fetchData={fetchData}
                onSelectAsset={this.sendUpdateSelected}
                uniqueTokens={sendableUniqueTokens}
              />
            )}
            {showAssetForm && (
              <SendAssetForm
                {...props}
                allAssets={allAssets}
                assetAmount={assetAmount}
                buttonRenderer={
                  <SendButton
                    {...props}
                    assetAmount={assetAmount}
                    isAuthorizing={isAuthorizing}
                    isSufficientBalance={isSufficientBalance}
                    isSufficientGas={isSufficientGas}
                    onLongPress={this.onLongPressSend}
                  />
                }
                nativeAmount={nativeAmount}
                onChangeAssetAmount={this.onChangeAssetAmount}
                onChangeNativeAmount={this.onChangeNativeAmount}
                onResetAssetSelection={this.onResetAssetSelection}
                selected={selected}
                sendMaxBalance={this.sendMaxBalance}
                txSpeedRenderer={
                  isIphoneX() && (
                    <SendTransactionSpeed
                      gasPrice={selectedGasPrice}
                      nativeCurrencySymbol={nativeCurrencySymbol}
                      onPressTransactionSpeed={this.onPressTransactionSpeed}
                    />
                  )
                }
              />
            )}
          </Container>
        </KeyboardAvoidingView>
      </SheetContainer>
    );
  }
}
