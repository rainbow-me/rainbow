import {
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
import React, { Fragment } from 'react';
import { LayoutAnimation, TextInput } from 'react-native';
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
  convertRawAmountToDecimalFormat,
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

const isSameAsset = (firstAsset, secondAsset) => {
  if (!firstAsset || !secondAsset) {
    return false;
  }

  const firstAddress = toLower(get(firstAsset, 'address', ''));
  const secondAddress = toLower(get(secondAsset, 'address', ''));
  return firstAddress === secondAddress;
};

class ExchangeModal extends React.Component {
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
    uniswapUpdateAllowances: PropTypes.func,
    uniswapUpdatePendingApprovals: PropTypes.func,
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

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.isTransitioning && !this.props.isTransitioning) {
      this.props.navigation.emit('refocus');
    }
    const isNewInputAmount = isNewValueForPath(
      this.state,
      prevState,
      'inputAmount'
    );
    const isNewOutputAmount = isNewValueForPath(
      this.state,
      prevState,
      'outputAmount'
    );
    const isNewNativeAmount =
      // Only consider 'new' if the native input isnt focused,
      // otherwise itll fight with the user's keystrokes
      isNewValueForPath(this.state, prevState, 'nativeAmount') &&
      this.nativeFieldRef.isFocused();

    const isNewInputCurrency = isNewValueForPath(
      this.state,
      prevState,
      'inputCurrency.uniqueId'
    );
    const isNewOutputCurrency = isNewValueForPath(
      this.state,
      prevState,
      'outputCurrency.uniqueId'
    );

    const isNewAmount =
      (this.state.inputAsExactAmount &&
        (isNewNativeAmount || isNewInputAmount)) ||
      (!this.state.inputAsExactAmount && isNewOutputAmount);
    const isNewCurrency = isNewInputCurrency || isNewOutputCurrency;

    const input = toLower(get(this.state.inputCurrency, 'address'));
    const removedFromPending =
      !get(this.props, `pendingApprovals[${input}]`, null) &&
      get(prevProps, `pendingApprovals[${input}]`, null);

    if (isNewAmount || isNewCurrency) {
      this.getMarketDetails();
      LayoutAnimation.easeInEaseOut();
    }
    if (
      removedFromPending ||
      isNewValueForPath(this.state, prevState, 'inputCurrency.address')
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

  getMarketDetails = async () => {
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
        inputAmount || 0,
        inputDecimals
      );
      const rawOutputAmount = convertAmountToRawAmount(
        outputAmount || 0,
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
          outputPriceValue
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      const slippage = get(tradeDetails, 'executionRateSlippage', 0).toString();
      const inputBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );

      this.setState({
        inputExecutionRate,
        inputNativePrice,
        isSufficientBalance:
          !inputAmount || Number(inputBalance) >= Number(inputAmount),
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

      if (inputAsExactAmount && !this.outputFieldRef.isFocused()) {
        if (isInputEmpty || isInputZero) {
          this.setOutputAmount();
        } else {
          const updatedAmount = get(tradeDetails, 'outputAmount.amount');
          const rawUpdatedAmount = convertRawAmountToDecimalFormat(
            updatedAmount,
            outputDecimals
          );

          const updatedAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedAmount,
            get(outputCurrency, 'price.value')
          );

          this.setOutputAmount(
            rawUpdatedAmount,
            updatedAmountDisplay,
            inputAsExactAmount
          );
        }
      }

      if (!inputAsExactAmount && !this.inputFieldRef.isFocused()) {
        if (isOutputEmpty || isOutputZero) {
          this.setInputAmount();
          this.setState({
            isSufficientBalance: true,
          });
        } else {
          const updatedAmount = get(tradeDetails, 'inputAmount.amount');
          const rawUpdatedAmount = convertRawAmountToDecimalFormat(
            updatedAmount,
            inputDecimals
          );

          const updatedAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedAmount,
            get(inputCurrency, 'price.value')
          );

          this.setInputAmount(
            rawUpdatedAmount,
            updatedAmountDisplay,
            inputAsExactAmount
          );

          this.setState({
            isSufficientBalance:
              Number(inputBalance) >= Number(rawUpdatedAmount),
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

  getReserveData = async tokenAddress => {
    if (tokenAddress === 'eth') return null;

    const { tokenReserves, uniswapGetTokenReserve } = this.props;

    let reserve = tokenReserves[tokenAddress.toLowerCase()];
    if (!reserve) {
      reserve = await uniswapGetTokenReserve(tokenAddress);
    }
    return reserve;
  };

  handleBlurField = ({ currentTarget }) => {
    console.log('blur', currentTarget);
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
      const { gasLimit, gasPrices, uniswapUpdatePendingApprovals } = this.props;
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
      uniswapUpdatePendingApprovals(
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
    if (!this.lastFocusedInput) {
      return this.inputFieldRef.focus();
    }

    if (this.lastFocusedInput !== TextInput.State.currentlyFocusedField()) {
      return TextInput.State.focusTextInput(this.lastFocusedInput);
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

        const isInputZero = Number(inputAmount) === 0;

        if (inputAmount && !isInputZero) {
          const nativePrice = get(inputCurrency, 'native.price.amount', 0);
          nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
        }

        newState.nativeAmount = nativeAmount;
      }

      return newState;
    });
  };

  setInputCurrency = (inputCurrency, force) => {
    const { outputCurrency } = this.state;

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

      const isNativeZero = Number(nativeAmount) === 0;

      if (nativeAmount && !isNativeZero) {
        const nativePrice = get(inputCurrency, 'native.price.amount', 0);
        inputAmount = convertAmountFromNativeValue(nativeAmount, nativePrice);
        inputAmountDisplay = updatePrecisionToDisplay(
          inputAmount,
          get(inputCurrency, 'price.value')
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

    this.setState({
      outputCurrency,
      showConfirmButton: !!outputCurrency,
    });
    if (!force) {
      this.props.uniswapUpdateOutputCurrency(outputCurrency);
    }

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
      inputAmountDisplay,
      inputCurrency,
      // inputExecutionRate,
      // inputNativePrice,
      isAssetApproved,
      isSufficientBalance,
      isUnlockingAsset,
      nativeAmount,
      outputAmountDisplay,
      outputCurrency,
      // outputExecutionRate,
      // outputNativePrice,
      showConfirmButton,
      slippage,
    } = this.state;

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
            {isSufficientBalance && <SlippageWarning slippage={slippage} />}
            {showConfirmButton && (
              <Fragment>
                <Centered css={padding(19, 15, 0)} flexShrink={0} width="100%">
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
