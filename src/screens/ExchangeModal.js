import {
  getMarketDetails as getUniswapMarketDetails,
  tradeEthForExactTokensWithData,
  tradeExactEthForTokensWithData,
  tradeExactTokensForEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactEthWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
import BigNumber from 'bignumber.js';
import { get, isNil, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { withNavigationFocus, NavigationEvents } from 'react-navigation';
import { compose, toClass, withProps } from 'recompact';
import { interpolate } from '../components/animations';
import {
  ConfirmExchangeButton,
  ExchangeInputField,
  ExchangeModalHeader,
  ExchangeOutputField,
  SlippageWarning,
} from '../components/exchange';
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import { GasSpeedButton } from '../components/gas';
import GestureBlocker from '../components/GestureBlocker';
import {
  Centered,
  Column,
  KeyboardFixedOpenLayout,
} from '../components/layout';
import { estimateSwapGasLimit, executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertAmountToRawAmount,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  divide,
  greaterThan,
  subtract,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withGas,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
} from '../hoc';
import { colors, padding, position } from '../styles';
import {
  isNewValueForObjectPaths,
  contractUtils,
  ethereumUtils,
  gasUtils,
  isNewValueForPath,
} from '../utils';
import { CurrencySelectionTypes } from './CurrencySelectModal';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(
  toClass(FloatingPanels)
);

const isSameAsset = (a, b) => {
  if (!a || !b) return false;
  const assetA = toLower(get(a, 'address', ''));
  const assetB = toLower(get(b, 'address', ''));
  return assetA === assetB;
};

class ExchangeModal extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    allowances: PropTypes.object,
    chainId: PropTypes.number,
    dataAddNewTransaction: PropTypes.func,
    gasLimit: PropTypes.number,
    gasUpdateDefaultGasLimit: PropTypes.func,
    gasUpdateTxFee: PropTypes.func,
    inputReserve: PropTypes.object,
    isFocused: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    outputReserve: PropTypes.object,
    pendingApprovals: PropTypes.object,
    selectedGasPrice: PropTypes.object,
    tabPosition: PropTypes.object, // animated value
    tokenReserves: PropTypes.object,
    tradeDetails: PropTypes.object,
    txFees: PropTypes.object,
    uniswapAddPendingApproval: PropTypes.func,
    uniswapUpdateAllowances: PropTypes.func,
  };

  state = {
    approvalCreationTimestamp: null,
    approvalEstimatedTimeInMs: null,
    inputAllowance: null,
    inputAmount: null,
    inputAmountDisplay: null,
    inputAsExactAmount: false,
    inputCurrency: ethereumUtils.getAsset(this.props.allAssets),
    inputExecutionRate: null,
    inputNativePrice: null,
    isAssetApproved: true,
    isSufficientBalance: true,
    isUnlockingAsset: false,
    nativeAmount: null,
    outputAmount: null,
    outputAmountDisplay: null,
    outputCurrency: null,
    outputExecutionRate: null,
    outputNativePrice: null,
    showConfirmButton: false,
    slippage: null,
    tradeDetails: null,
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewProps = isNewValueForObjectPaths(this.props, nextProps, [
      'inputReserve.token.address',
      'outputReserve.token.address',
    ]);

    const isNewState = isNewValueForObjectPaths(this.state, nextState, [
      'approvalCreationTimestamp',
      'approvalEstimatedTimeInMs',
      'inputAmount',
      'inputCurrency.uniqueId',
      'isAssetApproved',
      'isSufficientBalance',
      'isUnlockingAsset',
      'nativeAmount',
      'outputAmount',
      'outputCurrency.uniqueId',
      'slippage',
    ]);

    return isNewProps || isNewState;
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.isTransitioning && !this.props.isTransitioning) {
      this.props.navigation.emit('refocus');
    }

    const isNewAmountOrCurrency = isNewValueForObjectPaths(
      this.state,
      prevState,
      [
        'inputAmount',
        'inputCurrency.uniqueId',
        'outputAmount',
        'outputCurrency.uniqueId',
      ]
    );

    let isNewNativeAmount = isNewValueForPath(
      this.state,
      prevState,
      'nativeAmount'
    );

    if (isNewNativeAmount) {
      // Only consider 'new' if the native input isnt focused,
      // otherwise itll fight with the user's keystrokes
      isNewNativeAmount = this.nativeFieldRef.isFocused();
    }

    const isNewOutputReserveCurrency = isNewValueForPath(
      this.props,
      prevProps,
      'outputReserve.token.address'
    );

    if (
      isNewAmountOrCurrency ||
      isNewNativeAmount ||
      isNewOutputReserveCurrency
    ) {
      this.getMarketDetails(isNewOutputReserveCurrency);
    }

    const inputCurrencyAddressPath = 'inputCurrency.address';
    const inputCurrencyAddress = toLower(
      get(this.state, inputCurrencyAddressPath)
    );

    const removedFromPending =
      !get(this.props, `pendingApprovals[${inputCurrencyAddress}]`, null) &&
      get(prevProps, `pendingApprovals[${inputCurrencyAddress}]`, null);

    if (
      removedFromPending ||
      isNewValueForPath(this.state, prevState, inputCurrencyAddressPath)
    ) {
      this.getCurrencyAllowance();
    }
  };

  componentWillUnmount = () => {
    this.props.uniswapClearCurrenciesAndReserves();
  };

  lastFocusedInput = null;
  inputFieldRef = null;
  nativeFieldRef = null;
  outputFieldRef = null;

  assignInputFieldRef = ref => {
    this.inputFieldRef = ref;
  };
  assignNativeFieldRef = ref => {
    this.nativeFieldRef = ref;
  };
  assignOutputFieldRef = ref => {
    this.outputFieldRef = ref;
  };

  clearForm = () => {
    if (this.inputFieldRef) this.inputFieldRef.clear();
    if (this.nativeFieldRef) this.nativeFieldRef.clear();
    if (this.outputFieldRef) this.outputFieldRef.clear();
  };

  getCurrencyAllowance = async () => {
    const {
      accountAddress,
      allowances,
      gasUpdateTxFee,
      pendingApprovals,
      uniswapUpdateAllowances,
    } = this.props;
    const { inputCurrency } = this.state;
    const { address: inputAddress, exchangeAddress } = inputCurrency;

    if (inputAddress === 'eth') {
      return this.setState({ isAssetApproved: true });
    }

    let allowance = allowances[inputAddress];
    if (!greaterThan(allowance, 0)) {
      allowance = await contractUtils.getAllowance(
        accountAddress,
        inputCurrency,
        exchangeAddress
      );
      uniswapUpdateAllowances({ [toLower(inputAddress)]: allowance });
    }
    const isAssetApproved = greaterThan(allowance, 0);
    if (greaterThan(allowance, 0)) {
      return this.setState({
        approvalCreationTimestamp: null,
        approvalEstimatedTimeInMs: null,
        isAssetApproved,
        isUnlockingAsset: false,
      });
    }
    const pendingApproval = pendingApprovals[toLower(inputCurrency.address)];
    const isUnlockingAsset = !!pendingApproval;

    try {
      const gasLimit = await contractUtils.estimateApprove(
        inputCurrency.address,
        exchangeAddress
      );
      gasUpdateTxFee(gasLimit, gasUtils.FAST);
      return this.setState({
        approvalCreationTimestamp: isUnlockingAsset
          ? pendingApproval.creationTimestamp
          : null,
        approvalEstimatedTimeInMs: isUnlockingAsset
          ? pendingApproval.estimatedTimeInMs
          : null,
        isAssetApproved,
        isUnlockingAsset,
      });
    } catch (error) {
      gasUpdateTxFee();
      return this.setState({
        approvalCreationTimestamp: null,
        approvalEstimatedTimeInMs: null,
        isAssetApproved,
        isUnlockingAsset: false,
      });
    }
  };

  getMarketDetails = async isNewOutputReserveCurrency => {
    const {
      accountAddress,
      chainId,
      gasUpdateTxFee,
      inputReserve,
      nativeCurrency,
      outputReserve,
      selectedGasPrice,
    } = this.props;
    const {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      isAssetApproved,
      nativeAmount,
      outputAmount,
      outputCurrency,
    } = this.state;

    const isMissingAmounts = !inputAmount && !outputAmount;
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    const isMissingReserves =
      (inputCurrency && inputCurrency.address !== 'eth' && !inputReserve) ||
      (outputCurrency && outputCurrency.address !== 'eth' && !outputReserve);
    if (isMissingAmounts || isMissingCurrency || isMissingReserves) {
      return;
    }

    try {
      const { address: inputAddress, decimals: inputDecimals } = inputCurrency;
      const {
        address: outputAddress,
        decimals: outputDecimals,
      } = outputCurrency;

      const isInputEth = inputAddress === 'eth';
      const isOutputEth = outputAddress === 'eth';

      const rawInputAmount = convertAmountToRawAmount(
        parseFloat(inputAmount) || 0,
        inputDecimals
      );
      const rawOutputAmount = convertAmountToRawAmount(
        parseFloat(outputAmount) || 0,
        outputDecimals
      );

      let tradeDetails = null;

      if (isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactEthForTokensWithData(
              outputReserve,
              rawInputAmount,
              chainId
            )
          : tradeEthForExactTokensWithData(
              outputReserve,
              rawOutputAmount,
              chainId
            );
      } else if (!isInputEth && isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForEthWithData(
              inputReserve,
              rawInputAmount,
              chainId
            )
          : tradeTokensForExactEthWithData(
              inputReserve,
              rawOutputAmount,
              chainId
            );
      } else if (!isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForTokensWithData(
              inputReserve,
              outputReserve,
              rawInputAmount,
              chainId
            )
          : tradeTokensForExactTokensWithData(
              inputReserve,
              outputReserve,
              rawOutputAmount,
              chainId
            );
      }

      let inputExecutionRate = '';
      let outputExecutionRate = '';
      let inputNativePrice = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = get(inputCurrency, 'price.value', 0);
        inputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rate', BigNumber(0)),
          inputPriceValue
        );

        inputNativePrice = convertAmountToNativeDisplay(
          inputPriceValue,
          nativeCurrency
        );
      }

      if (outputCurrency) {
        const outputPriceValue = get(outputCurrency, 'price.value', 0);
        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
          outputPriceValue,
          true
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      const slippage = convertNumberToString(
        get(tradeDetails, 'executionRateSlippage', 0)
      );
      const inputBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );

      const isSufficientBalance =
        !parseFloat(inputAmount) ||
        parseFloat(inputBalance) >= parseFloat(inputAmount);

      this.setState({
        inputExecutionRate,
        inputNativePrice,
        isSufficientBalance,
        outputExecutionRate,
        outputNativePrice,
        slippage,
        tradeDetails,
      });

      const isInputEmpty = !inputAmount;
      const isNativeEmpty = !nativeAmount;
      const isOutputEmpty = !outputAmount;

      const isInputZero = Number(inputAmount) === 0;
      const isOutputZero = Number(outputAmount) === 0;

      if (this.nativeFieldRef.isFocused() && isNativeEmpty) {
        this.clearForm();
      }

      if (
        inputAsExactAmount ||
        (isNewOutputReserveCurrency && inputAsExactAmount)
      ) {
        if ((isInputEmpty || isInputZero) && !this.outputFieldRef.isFocused()) {
          this.setOutputAmount();
        } else {
          const updatedOutputAmount = get(tradeDetails, 'outputAmount.amount');
          const rawUpdatedOutputAmount = convertRawAmountToDecimalFormat(
            updatedOutputAmount,
            outputDecimals
          );

          if (rawUpdatedOutputAmount !== '0') {
            const updatedOutputAmountDisplay = updatePrecisionToDisplay(
              rawUpdatedOutputAmount,
              get(outputCurrency, 'price.value')
            );

            this.setOutputAmount(
              rawUpdatedOutputAmount,
              updatedOutputAmountDisplay,
              inputAsExactAmount
            );
          }
        }
      }

      if (!inputAsExactAmount && !this.inputFieldRef.isFocused()) {
        if (isOutputEmpty || isOutputZero) {
          this.setInputAmount();
          this.setState({
            isSufficientBalance: true,
          });
        } else {
          const updatedInputAmount = get(tradeDetails, 'inputAmount.amount');
          const rawUpdatedInputAmount = convertRawAmountToDecimalFormat(
            updatedInputAmount,
            inputDecimals
          );

          const updatedInputAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedInputAmount,
            get(inputCurrency, 'price.value'),
            true
          );

          this.setInputAmount(
            rawUpdatedInputAmount,
            updatedInputAmountDisplay,
            inputAsExactAmount
          );

          this.setState({
            isSufficientBalance:
              parseFloat(inputBalance) >= parseFloat(rawUpdatedInputAmount),
          });
        }
      }

      if (isAssetApproved) {
        const gasLimit = await estimateSwapGasLimit(
          accountAddress,
          tradeDetails
        );
        gasUpdateTxFee(gasLimit);
      }
    } catch (error) {
      console.log('error getting market details', error);
      // TODO error state
    }
  };

  handleFocusField = ({ currentTarget }) => {
    this.lastFocusedInput = currentTarget;
  };

  handlePressMaxBalance = () => {
    const { inputCurrency } = this.state;
    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return this.setInputAmount(maxBalance);
  };

  handleSubmit = async () => {
    const {
      accountAddress,
      dataAddNewTransaction,
      gasLimit,
      navigation,
      selectedGasPrice,
    } = this.props;
    const { inputAmount, inputCurrency, tradeDetails } = this.state;

    try {
      const gasPrice = get(selectedGasPrice, 'value.amount');
      const txn = await executeSwap(tradeDetails, gasLimit, gasPrice);
      if (txn) {
        dataAddNewTransaction({
          amount: inputAmount,
          asset: inputCurrency,
          from: accountAddress,
          hash: txn.hash,
          nonce: get(txn, 'nonce'),
          to: get(txn, 'to'),
        });
      }
      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.log('error submitting swap', error);
      navigation.navigate('WalletScreen');
    }
  };

  handleUnlockAsset = async () => {
    try {
      const { inputCurrency } = this.state;
      const { gasLimit, gasPrices, uniswapAddPendingApproval } = this.props;
      const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
      const {
        creationTimestamp: approvalCreationTimestamp,
        approval: { hash },
      } = await contractUtils.approve(
        inputCurrency.address,
        inputCurrency.exchangeAddress,
        gasLimit,
        get(fastGasPrice, 'value.amount')
      );
      const approvalEstimatedTimeInMs = get(
        fastGasPrice,
        'estimatedTime.amount'
      );
      uniswapAddPendingApproval(
        inputCurrency.address,
        hash,
        approvalCreationTimestamp,
        approvalEstimatedTimeInMs
      );
      this.setState({
        approvalCreationTimestamp,
        approvalEstimatedTimeInMs,
        isUnlockingAsset: true,
      });
    } catch (error) {
      console.log('could not unlock asset', error);
      this.setState({
        approvalCreationTimestamp: null,
        approvalEstimatedTimeInMs: null,
        isUnlockingAsset: false,
      });
    }
  };

  handleKeyboardManagement = () => {
    if (this.lastFocusedInput !== TextInput.State.currentlyFocusedField()) {
      TextInput.State.focusTextInput(this.lastFocusedInput);
      this.lastFocusedInput = null;
    }
  };

  navigateToSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setInputCurrency,
      type: CurrencySelectionTypes.input,
    });
  };

  navigateToSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setOutputCurrency,
      type: CurrencySelectionTypes.output,
    });
  };

  getMarketPrice = () => {
    const { allAssets, inputReserve } = this.props;
    if (!inputReserve) return 0;
    const ethPrice = ethereumUtils.getEthPriceUnit(allAssets);
    const inputMarketDetails = getUniswapMarketDetails(undefined, inputReserve);
    const assetToEthPrice = get(inputMarketDetails, 'marketRate.rate');
    return divide(ethPrice, assetToEthPrice) || 0;
  };

  setInputAmount = (inputAmount, amountDisplay, inputAsExactAmount = true) => {
    this.setState(({ inputCurrency }) => {
      const newState = {
        inputAmount,
        inputAmountDisplay:
          amountDisplay !== undefined ? amountDisplay : inputAmount,
        inputAsExactAmount,
      };

      if (!this.nativeFieldRef.isFocused()) {
        let nativeAmount = null;

        const isInputZero = parseFloat(inputAmount) === 0;

        if (inputAmount && !isInputZero) {
          let nativePrice = get(inputCurrency, 'native.price.amount', null);
          if (isNil(nativePrice)) {
            nativePrice = this.getMarketPrice();
          }
          nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
        }

        newState.nativeAmount = nativeAmount;
      }

      return newState;
    });
  };

  setInputCurrency = (inputCurrency, force) => {
    const { outputCurrency } = this.state;

    if (!isSameAsset(inputCurrency, this.state.inputCurrency)) {
      this.clearForm();
    }

    this.setState({ inputCurrency });

    if (!force) {
      this.props.uniswapUpdateInputCurrency(inputCurrency);
    }

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      if (!isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setOutputCurrency(null, true);
      } else {
        this.setOutputCurrency(inputCurrency, true);
      }
    }
  };

  setNativeAmount = nativeAmount =>
    this.setState(({ inputCurrency }) => {
      let inputAmount = null;
      let inputAmountDisplay = null;

      const isNativeZero = parseFloat(nativeAmount) === 0;

      if (nativeAmount && !isNativeZero) {
        let nativePrice = get(inputCurrency, 'native.price.amount', null);
        if (isNil(nativePrice)) {
          nativePrice = this.getMarketPrice();
        }
        inputAmount = convertAmountFromNativeValue(nativeAmount, nativePrice);
        inputAmountDisplay = updatePrecisionToDisplay(
          inputAmount,
          nativePrice,
          true
        );
      }

      return {
        inputAmount,
        inputAmountDisplay,
        inputAsExactAmount: true,
        nativeAmount,
      };
    });

  setOutputAmount = (outputAmount, amountDisplay, inputAsExactAmount = false) =>
    this.setState({
      inputAsExactAmount,
      outputAmount,
      outputAmountDisplay:
        amountDisplay !== undefined ? amountDisplay : outputAmount,
    });

  setOutputCurrency = (outputCurrency, force) => {
    const { allAssets } = this.props;
    const { inputCurrency } = this.state;

    if (!force) {
      this.props.uniswapUpdateOutputCurrency(outputCurrency);
    }

    this.setState({
      inputAsExactAmount: true,
      outputCurrency,
      showConfirmButton: !!outputCurrency,
    });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      const outputAddress = toLower(outputCurrency.address);
      const asset = ethereumUtils.getAsset(allAssets, outputAddress);

      if (!isNil(asset) && !isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setInputCurrency(null, true);
      } else {
        this.setInputCurrency(outputCurrency, true);
      }
    }
  };

  render = () => {
    const { nativeCurrency, tabPosition } = this.props;

    const {
      approvalCreationTimestamp,
      approvalEstimatedTimeInMs,
      inputAmount,
      inputAmountDisplay,
      inputCurrency,
      // inputExecutionRate,
      // inputNativePrice,
      isAssetApproved,
      isSufficientBalance,
      isUnlockingAsset,
      nativeAmount,
      outputAmount,
      outputAmountDisplay,
      outputCurrency,
      // outputExecutionRate,
      // outputNativePrice,
      showConfirmButton,
      slippage,
    } = this.state;

    const isSlippageWarningVisible =
      isSufficientBalance && !!inputAmount && !!outputAmount;

    return (
      <KeyboardFixedOpenLayout>
        <NavigationEvents onWillFocus={this.handleKeyboardManagement} />
        <Centered
          {...position.sizeAsObject('100%')}
          backgroundColor={colors.transparent}
          direction="column"
        >
          <AnimatedFloatingPanels
            margin={0}
            style={{
              opacity: interpolate(tabPosition, {
                extrapolate: Animated.Extrapolate.CLAMP,
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <FloatingPanel
              radius={exchangeModalBorderRadius}
              overflow="visible"
            >
              <GestureBlocker type="top" />
              <ExchangeModalHeader />
              <ExchangeInputField
                inputAmount={inputAmountDisplay}
                inputCurrencySymbol={get(inputCurrency, 'symbol', null)}
                inputFieldRef={this.assignInputFieldRef}
                isAssetApproved={isAssetApproved}
                isUnlockingAsset={isUnlockingAsset}
                nativeAmount={nativeAmount}
                nativeCurrency={nativeCurrency}
                nativeFieldRef={this.assignNativeFieldRef}
                onFocus={this.handleFocusField}
                onPressMaxBalance={this.handlePressMaxBalance}
                onPressSelectInputCurrency={this.navigateToSelectInputCurrency}
                onUnlockAsset={this.handleUnlockAsset}
                setInputAmount={this.setInputAmount}
                setNativeAmount={this.setNativeAmount}
              />
              <ExchangeOutputField
                bottomRadius={exchangeModalBorderRadius}
                onFocus={this.handleFocusField}
                onPressSelectOutputCurrency={
                  this.navigateToSelectOutputCurrency
                }
                outputAmount={outputAmountDisplay}
                outputCurrency={get(outputCurrency, 'symbol', null)}
                outputFieldRef={this.assignOutputFieldRef}
                setOutputAmount={this.setOutputAmount}
              />
            </FloatingPanel>
            {isSlippageWarningVisible && (
              <SlippageWarning slippage={slippage} />
            )}
            {showConfirmButton && (
              <Fragment>
                <Centered css={padding(24, 15, 0)} flexShrink={0} width="100%">
                  <ConfirmExchangeButton
                    creationTimestamp={approvalCreationTimestamp}
                    disabled={isAssetApproved && !Number(inputAmountDisplay)}
                    inputCurrencyName={get(inputCurrency, 'symbol')}
                    isAssetApproved={isAssetApproved}
                    isSufficientBalance={isSufficientBalance}
                    isUnlockingAsset={isUnlockingAsset}
                    onSubmit={this.handleSubmit}
                    onUnlockAsset={this.handleUnlockAsset}
                    slippage={slippage}
                    timeRemaining={approvalEstimatedTimeInMs}
                  />
                </Centered>
                <GasSpeedButton />
              </Fragment>
            )}
            <Column>
              <GestureBlocker type="bottom" />
            </Column>
          </AnimatedFloatingPanels>
        </Centered>
      </KeyboardFixedOpenLayout>
    );
  };
}

export default compose(
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withGas,
  withNavigationFocus,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
  withProps(({ navigation, transitionProps: { isTransitioning } }) => ({
    isTransitioning,
    tabPosition: get(navigation, 'state.params.position'),
  }))
)(ExchangeModal);
