import {
  tradeEthForExactTokensWithData,
  tradeExactEthForTokensWithData,
  tradeExactTokensForEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactEthWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
import BigNumber from 'bignumber.js';
import { get, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { InteractionManager, LayoutAnimation, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps, toClass } from 'recompact';
import { Text } from '../components/text';
import { executeSwap } from '../handlers/uniswap';
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
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { contractUtils, ethereumUtils, isNewValueForPath } from '../utils';
import {
  ConfirmExchangeButton,
  ExchangeGasFeeButton,
  ExchangeInputField,
  ExchangeModalHeader,
  ExchangeOutputField,
  SlippageWarning,
} from '../components/exchange';
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import GestureBlocker from '../components/GestureBlocker';
import {
  Centered,
  Column,
  KeyboardFixedOpenLayout,
} from '../components/layout';
import { CurrencySelectionTypes } from './CurrencySelectModal';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(toClass(FloatingPanels));

const isSameAsset = (firstAsset, secondAsset) => {
  if (!firstAsset || !secondAsset) {
    return false;
  }

  const firstAddress = get(firstAsset, 'address', '').toLowerCase();
  const secondAddress = get(secondAsset, 'address', '').toLowerCase();
  return firstAddress === secondAddress;
};

class ExchangeModal extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssets: PropTypes.array,
    allowances: PropTypes.object,
    chainId: PropTypes.number,
    clearKeyboardFocusHistory: PropTypes.func,
    dataAddNewTransaction: PropTypes.func,
    isFocused: PropTypes.bool,
    isTransitioning: PropTypes.bool,
    keyboardFocusHistory: PropTypes.array,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    pushKeyboardFocusHistory: PropTypes.func,
    tokenReserves: PropTypes.array,
    tradeDetails: PropTypes.object,
    transitionPosition: PropTypes.object, // animated value
    uniswapGetTokenReserve: PropTypes.func,
    uniswapUpdateAllowances: PropTypes.func,
  }

  state = {
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
  }

  componentDidUpdate = (prevProps, prevState) => {
    const {
      isFocused,
      isTransitioning,
      keyboardFocusHistory,
    } = this.props;

    if (isFocused && (!isTransitioning && prevProps.isTransitioning)) {
      const lastFocusedInput = keyboardFocusHistory[keyboardFocusHistory.length - 2];

      if (lastFocusedInput) {
        InteractionManager.runAfterInteractions(() => {
          TextInput.State.focusTextInput(lastFocusedInput);
        });
      } else {
        // console.log('ELSE')
        // this.inputFieldRef.focus();
      }
    }

    if (this.state.outputCurrency) {
      this.setState({ showConfirmButton: true });
    }

    const isNewNativeAmount = isNewValueForPath(this.state, prevState, 'nativeAmount');
    const isNewInputAmount = isNewValueForPath(this.state, prevState, 'inputAmount');
    const isNewOutputAmount = isNewValueForPath(this.state, prevState, 'outputAmount');

    const isNewInputCurrency = isNewValueForPath(this.state, prevState, 'inputCurrency');
    const isNewOutputCurrency = isNewValueForPath(this.state, prevState, 'outputCurrency');

    const isNewAmount = isNewNativeAmount || isNewInputAmount || isNewOutputAmount;
    const isNewCurrency = isNewInputCurrency || isNewOutputCurrency;

    if (isNewAmount || isNewCurrency) {
      this.getMarketDetails();
      LayoutAnimation.easeInEaseOut();
    }

    if (isNewValueForPath(this.state, prevState, 'inputCurrency.address')) {
      this.getCurrencyAllowance();
    }
  }

  componentWillUnmount = () => {
    this.props.clearKeyboardFocusHistory();
  }

  /* eslint-disable lines-between-class-members */
  inputFieldRef = null
  nativeFieldRef = null
  outputFieldRef = null

  assignInputFieldRef = (ref) => { this.inputFieldRef = ref; }
  assignNativeFieldRef = (ref) => { this.nativeFieldRef = ref; }
  assignOutputFieldRef = (ref) => { this.outputFieldRef = ref; }
  /* eslint-enable lines-between-class-members */

  getCurrencyAllowance = async () => {
    const { accountAddress, allowances, uniswapUpdateAllowances } = this.props;
    const { inputCurrency } = this.state;
    const { address: inputAddress, exchangeAddress } = inputCurrency;

    if (inputAddress === 'eth') {
      return this.setState({ isAssetApproved: true });
    }

    let allowance = allowances[inputAddress];
    if (!allowance) {
      allowance = await contractUtils.getAllowance(accountAddress, inputCurrency, exchangeAddress);
      uniswapUpdateAllowances(inputAddress, allowance);
    }

    return this.setState({ isAssetApproved: greaterThan(allowance, 0) });
  }

  getReserveData = async (tokenAddress) => {
    const { tokenReserves, uniswapGetTokenReserve } = this.props;

    if (tokenAddress === 'eth') {
      return null;
    }

    let reserve = tokenReserves[tokenAddress.toLowerCase()];
    if (!reserve) {
      reserve = await uniswapGetTokenReserve(tokenAddress);
    }

    return reserve;
  }

  getMarketDetails = async () => {
    const { chainId, nativeCurrency } = this.props;
    const {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      outputAmount,
      outputCurrency,
    } = this.state;

    const isMissingAmounts = !inputAmount && !outputAmount;
    const isMissingCurrency = !inputCurrency || !outputCurrency;
    if (isMissingAmounts || isMissingCurrency) {
      return;
    }

    try {
      const {
        address: inputAddress,
        balance: { amount: inputBalance },
        decimals: inputDecimals,
      } = inputCurrency;
      const {
        address: outputAddress,
        decimals: outputDecimals,
      } = outputCurrency;

      const isInputEth = inputAddress === 'eth';
      const isOutputEth = outputAddress === 'eth';

      const inputReserve = await this.getReserveData(inputAddress);
      const outputReserve = await this.getReserveData(outputAddress);

      const rawInputAmount = convertAmountToRawAmount(inputAmount || 0, inputDecimals);
      const rawOutputAmount = convertAmountToRawAmount(outputAmount || 0, outputDecimals);

      let tradeDetails = null;

      if (isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactEthForTokensWithData(outputReserve, rawInputAmount, chainId)
          : tradeEthForExactTokensWithData(outputReserve, rawOutputAmount, chainId);
      } else if (!isInputEth && isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForEthWithData(inputReserve, rawInputAmount, chainId)
          : tradeTokensForExactEthWithData(inputReserve, rawOutputAmount, chainId);
      } else if (!isInputEth && !isOutputEth) {
        tradeDetails = inputAsExactAmount
          ? tradeExactTokensForTokensWithData(inputReserve, outputReserve, rawInputAmount, chainId)
          : tradeTokensForExactTokensWithData(inputReserve, outputReserve, rawOutputAmount, chainId);
      }

      let inputExecutionRate = '';
      let outputExecutionRate = '';
      let inputNativePrice = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = get(inputCurrency, 'price.value', 0);
        inputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rate', BigNumber(0)),
          inputPriceValue,
        );

        inputNativePrice = convertAmountToNativeDisplay(
          inputPriceValue,
          nativeCurrency,
        );
      }

      if (outputCurrency) {
        const outputPriceValue = get(outputCurrency, 'price.value', 0);
        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
          outputPriceValue,
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency,
        );
      }

      this.setState({
        inputExecutionRate,
        inputNativePrice,
        isSufficientBalance: Number(inputBalance) >= Number(inputAmount),
        outputExecutionRate,
        outputNativePrice,
        slippage: get(tradeDetails, 'marketRateSlippage', 0).toFixed(),
        tradeDetails,
      });

      if (inputAsExactAmount) {
        const updatedAmount = get(tradeDetails, 'outputAmount.amount');
        const rawUpdatedAmount = convertRawAmountToDecimalFormat(updatedAmount, outputDecimals);
        this.setOutputAmount(rawUpdatedAmount, false); // should this be true?
      } else {
        const updatedAmount = get(tradeDetails, 'inputAmount.amount');
        const rawUpdatedAmount = convertRawAmountToDecimalFormat(updatedAmount, inputDecimals);
        this.setInputAmount(rawUpdatedAmount, true); // should this be true?
      }
    } catch (error) {
      console.log('error getting market details', error);
      // TODO
    }
  }

  setInputAmount = (inputAmount, isExact = true) => {
    this.setState(({ inputCurrency }) => {
      const nativePrice = get(inputCurrency, 'native.price.amount', 0);

      let nativeAmount = null;
      if (inputAmount) {
        nativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
      }

      return {
        inputAmount,
        inputAmountDisplay: updatePrecisionToDisplay(inputAmount, get(inputCurrency, 'price.value')),
        inputAsExactAmount: isExact,
        nativeAmount,
      };
    });
  }

  setNativeAmount = (nativeAmount, isExact = true) => {
    this.setState(({ inputCurrency }) => {
      const nativePrice = get(inputCurrency, 'native.price.amount', 0);
      const inputAmount = convertAmountFromNativeValue(nativeAmount, nativePrice);

      return {
        inputAmount,
        inputAmountDisplay: updatePrecisionToDisplay(inputAmount, get(inputCurrency, 'price.value')),
        inputAsExactAmount: isExact,
        nativeAmount,
      };
    });
  }

  setOutputAmount = (outputAmount, isExact = false) => {
    this.setState(({ outputCurrency }) => ({
      inputAsExactAmount: isExact,
      outputAmount,
      outputAmountDisplay: updatePrecisionToDisplay(outputAmount, get(outputCurrency, 'price.value')),
    }));
  }

  setInputCurrency = (inputCurrency, force) => {
    const { outputCurrency } = this.state;

    this.setState({ inputCurrency });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      if (!isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setOutputCurrency(null, true);
      } else {
        this.setOutputCurrency(inputCurrency, true);
      }
    }
  }

  setOutputCurrency = (outputCurrency, force) => {
    const { allAssets } = this.props;
    const { inputCurrency } = this.state;

    this.setState({ outputCurrency });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      const outputAddress = outputCurrency.address.toLowerCase();
      const asset = ethereumUtils.getAsset(allAssets, outputAddress);

      if (!isNil(asset) && !isNil(inputCurrency) && !isNil(outputCurrency)) {
        this.setInputCurrency(null, true);
      } else {
        this.setInputCurrency(outputCurrency, true);
      }
    }
  }

  onPressMaxBalance = () => {
    const { inputCurrency } = this.state;
    let maxBalance = get(inputCurrency, 'balance.amount', 0);
    if (inputCurrency.address === 'eth') {
      maxBalance = subtract(maxBalance, 0.01);
    }

    return this.setInputAmount(maxBalance);
  }

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setInputCurrency,
      type: CurrencySelectionTypes.input,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setOutputCurrency,
      type: CurrencySelectionTypes.output,
    });
  }

  handleSubmit = async () => {
    const { accountAddress, dataAddNewTransaction, navigation } = this.props;
    const { inputAmount, inputCurrency, tradeDetails } = this.state;

    try {
      const txn = await executeSwap(tradeDetails);
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
  }

  handleWillFocus = ({ lastState }) => {
    if (!lastState && this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  }

  handleDidFocus = () => {
    // console.log('DID FOCUS', this.props.navigation)
  }

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  handleUnlockAsset = async () => {
    const {
      inputCurrency: {
        address: tokenAddress,
        exchangeAddress: spender,
      },
    } = this.state;

    // const approval = await contractUtils.approve(tokenAddress, spender);

    this.setState({ isUnlockingAsset: true });
  }

  render = () => {
    const { nativeCurrency, transitionPosition } = this.props;

    const {
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
        <NavigationEvents
          onDidFocus={this.handleDidFocus}
          onWillFocus={this.handleWillFocus}
        />
        <Centered
          {...position.sizeAsObject('100%')}
          backgroundColor={colors.transparent}
          direction="column"
        >
          <AnimatedFloatingPanels
            margin={0}
            style={{
              opacity: Animated.interpolate(transitionPosition, {
                extrapolate: 'clamp',
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <GestureBlocker type='top'/>
            <FloatingPanel radius={exchangeModalBorderRadius}>
              <ExchangeModalHeader />
              <Column align="center" flex={0}>
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
                  onPressMaxBalance={this.onPressMaxBalance}
                  onPressSelectInputCurrency={this.handleSelectInputCurrency}
                  onUnlockAsset={this.handleUnlockAsset}
                  setInputAmount={this.setInputAmount}
                  setNativeAmount={this.setNativeAmount}
                />
                <ExchangeOutputField
                  onFocus={this.handleFocusField}
                  onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                  outputAmount={outputAmountDisplay}
                  outputCurrency={get(outputCurrency, 'symbol', null)}
                  outputFieldRef={this.assignOutputFieldRef}
                  setOutputAmount={this.setOutputAmount}
                />
              </Column>
            </FloatingPanel>
            {isSufficientBalance && <SlippageWarning slippage={slippage} />}
            {showConfirmButton && (
              <Fragment>
                <Centered
                  css={padding(19, 15, 0)}
                  flexShrink={0}
                  width="100%"
                >
                  <ConfirmExchangeButton
                    disabled={isAssetApproved && !Number(inputAmountDisplay)}
                    inputCurrencyName={get(inputCurrency, 'symbol')}
                    isAssetApproved={isAssetApproved}
                    isSufficientBalance={isSufficientBalance}
                    isUnlockingAsset={isUnlockingAsset}
                    onSubmit={this.handleSubmit}
                    onUnlockAsset={this.handleUnlockAsset}
                    slippage={slippage}
                  />
                </Centered>
                <ExchangeGasFeeButton
                  gasPrice={'$0.06'}
                />
              </Fragment>
            )}
            <GestureBlocker type='bottom'/>
          </AnimatedFloatingPanels>
        </Centered>
      </KeyboardFixedOpenLayout>
    );
  }
}

export default compose(
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withNavigationFocus,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAllowances,
  withUniswapAssets,
  mapProps(({
    navigation,
    stackTransitionProps: {
      isTransitioning: isStacksTransitioning,
    },
    tabsTransitionProps: {
      isTransitioning: isTabsTransitioning,
    },
    ...props
  }) => ({
    ...props,
    isTransitioning: isStacksTransitioning || isTabsTransitioning,
    navigation,
    transitionPosition: get(navigation, 'state.params.position'),
  })),
)(ExchangeModal);
