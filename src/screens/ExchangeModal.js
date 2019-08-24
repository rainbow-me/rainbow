import {
  tradeEthForExactTokens,
  tradeExactEthForTokens,
  tradeExactTokensForEth,
  tradeExactTokensForTokens,
  tradeTokensForExactEth,
  tradeTokensForExactTokens,
} from '@uniswap/sdk';
import {
  filter,
  findIndex,
  get,
  isNil,
  keys,
  map,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { InteractionManager, LayoutAnimation, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationActions, NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps, toClass, withProps } from 'recompact';
import { executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
  subtract,
} from '../helpers/utilities';
import {
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withTransactionConfirmationScreen,
  withTransitionProps,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../utils';
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
import { Text } from '../components/text';
import { CurrencySelectionTypes } from './CurrencySelectModal';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(toClass(FloatingPanels));

const isSameAsset = (firstAsset, secondAsset) => {
  if (!firstAsset || !secondAsset) {
    return false;
  }

  const firstAddress = get(firstAsset, 'address', '').toLowerCase();
  const secondAddress = get(firstAsset, 'address', '').toLowerCase();
  return firstAddress === secondAddress;
}

class ExchangeModal extends PureComponent {
  static propTypes = {
    allAssets: PropTypes.array,
    chainId: PropTypes.number,
    clearKeyboardFocusHistory: PropTypes.func,
    dataAddNewTransaction: PropTypes.func,
    keyboardFocusHistory: PropTypes.array,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    pushKeyboardFocusHistory: PropTypes.func,
    tradeDetails: PropTypes.object,
  }

  state = {
    inputAmount: null,
    inputAsExactAmount: false,
    inputCurrency: ethereumUtils.getAsset(this.props.allAssets),
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
    slippage: null,
    tradeDetails: null,
  }

  componentDidUpdate = (prevProps) => {
    const { isFocused, isTransitioning, keyboardFocusHistory} = this.props;
    const { inputAmount, outputAmount, outputCurrency } = this.state;

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

    if (inputAmount || outputAmount) {
      LayoutAnimation.easeInEaseOut();
    }

    if (outputCurrency) {
      console.log('should showConfirmButton');
      this.setState({ showConfirmButton: true });
    }
  }

  componentWillUnmount = () => {
    this.props.clearKeyboardFocusHistory();
  }

  inputFieldRef = null

  nativeFieldRef = null

  outputFieldRef = null

  parseTradeDetails = (path, tradeDetails, decimals) => {
    const updatedValue = get(tradeDetails, path);
    const slippage = get(tradeDetails, 'marketRateSlippage');
    const rawUpdatedValue = convertRawAmountToDecimalFormat(updatedValue, decimals);
    return { rawUpdatedValue, slippage: slippage.toFixed() };
  };

  getMarketDetails = async () => {
    try {
      let tradeDetails = null;
      const { chainId } = this.props;
      const {
        inputAmount,
        inputAsExactAmount,
        inputCurrency,
        outputAmount,
        outputCurrency,
      } = this.state;
      if (inputCurrency === null || outputCurrency === null) return;
      if (isNil(inputAmount) && isNil(outputAmount)) return;
      const {
        address: inputCurrencyAddress,
        decimals: inputDecimals,
      } = inputCurrency;
      const {
        address: outputCurrencyAddress,
        decimals: outputDecimals,
      } = outputCurrency;
      const rawInputAmount = convertAmountToRawAmount(inputAmount || 0, inputDecimals);
      const rawOutputAmount = convertAmountToRawAmount(outputAmount || 0, outputDecimals);

      if (inputCurrencyAddress === 'eth' && outputCurrencyAddress !== 'eth') {
        tradeDetails = inputAsExactAmount
          ? await tradeExactEthForTokens(outputCurrencyAddress, rawInputAmount, chainId)
          : await tradeEthForExactTokens(outputCurrencyAddress, rawOutputAmount, chainId);
      } else if (inputCurrencyAddress !== 'eth' && outputCurrencyAddress === 'eth') {
        tradeDetails = inputAsExactAmount
          ? await tradeExactTokensForEth(inputCurrencyAddress, rawInputAmount, chainId)
          : await tradeTokensForExactEth(inputCurrencyAddress, rawOutputAmount, chainId);
      } else if (inputCurrencyAddress !== 'eth' && outputCurrencyAddress !== 'eth') {
        tradeDetails = inputAsExactAmount
          ? await tradeExactTokensForTokens(inputCurrencyAddress, outputCurrencyAddress, rawInputAmount, chainId)
          : await tradeTokensForExactTokens(inputCurrencyAddress, outputCurrencyAddress, rawOutputAmount, chainId);
      }
      const decimals = inputAsExactAmount ? outputDecimals : inputDecimals;
      const path = inputAsExactAmount ? 'outputAmount.amount' : 'inputAmount.amount';
      this.setState({ tradeDetails });
      const { rawUpdatedValue, slippage } = this.parseTradeDetails(path, tradeDetails, decimals);
      if (inputAsExactAmount) {
        this.setState({ outputAmount: rawUpdatedValue, slippage });
      } else {
        this.setState({ inputAmount: rawUpdatedValue, slippage });
      }
    } catch (error) {
      console.log('error getting market details', error);
      // TODO
    }
  }

  setInputAsExactAmount = (inputAsExactAmount) => this.setState({ inputAsExactAmount })

  setNativeAmount = async (nativeAmount) => {
    this.setState({ nativeAmount });
    const nativePrice = get(this.state.inputCurrency, 'native.price.amount', 0);
    this.setState({ inputAmount: convertAmountFromNativeValue(nativeAmount, nativePrice) });
    this.setInputAsExactAmount(true);
    await this.getMarketDetails();
  }

  setInputAmount = async (inputAmount) => {
    this.setState({ inputAmount });

    let newNativeAmount = null;
    if (inputAmount) {
      const nativePrice = get(this.state.inputCurrency, 'native.price.amount', 0);
      newNativeAmount = convertAmountToNativeAmount(inputAmount, nativePrice);
    }

    this.setState({ nativeAmount: newNativeAmount });
    this.setInputAsExactAmount(true);
    await this.getMarketDetails();
  }

  setOutputAmount = async (outputAmount) => {
    this.setState({ outputAmount });
    this.setInputAsExactAmount(false);
    await this.getMarketDetails();
  }

  setInputCurrency = (inputCurrencySelection, force) => {
    const { inputCurrency, outputCurrency } = this.state;

    this.setState({ inputCurrency: inputCurrencySelection });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      if (outputCurrency !== null && inputCurrency !== null) {
        return this.setOutputCurrency(null, true);
      }

      return this.setOutputCurrency(inputCurrency, true);
    }
  }

  setOutputCurrency = (outputCurrency, force) => {
    const { allAssets } = this.props;
    const { inputCurrency } = this.state;

    this.setState({ outputCurrency });

    if (!force && isSameAsset(inputCurrency, outputCurrency)) {
      const asset = ethereumUtils.getAsset(allAssets, outputCurrency.address.toLowerCase());

      console.log('asset', asset);
      //
      if (inputCurrency !== null && outputCurrency !== null && !isNil(asset)) {
        this.setInputCurrency(null, true);
      } else {
        this.setInputCurrency(outputCurrency, true);
      }
    }
  }

  onPressMaxBalance = () => {
    const { inputCurrency } = this.state;
    const balance = get(inputCurrency, 'balance.amount', 0);
    const inputAmount = (inputCurrency.address === 'eth') ? subtract(balance, 0.01) : balance;
    this.setState({ inputAmount });
  }

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      type: CurrencySelectionTypes.input,
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      type: CurrencySelectionTypes.output,
      onSelectCurrency: this.setOutputCurrency,
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
      return this.inputFieldRef.focus();
    }
  }

  handleInputFieldRef = (ref) => { this.inputFieldRef = ref; }

  handleNativeFieldRef = (ref) => { this.nativeFieldRef = ref; }

  handleOutputFieldRef = (ref) => { this.outputFieldRef = ref; }

  handleDidFocus = () => {
    // console.log('DID FOCUS', this.props.navigation)

    // if (this.inputFieldRef) {
    //   setTimeout(() => this.inputFieldRef.focus(), 250);
    // }
  }

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  render = () => {
    const {
      keyboardFocusHistory,
      nativeCurrency,
      navigation,
      onPressConfirmExchange,
      transitionPosition,
    } = this.props;

    const {
      inputAmount,
      inputCurrency,
      nativeAmount,
      outputAmount,
      outputCurrency,
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
                  inputAmount={inputAmount}
                  inputCurrency={get(inputCurrency, 'symbol', null)}
                  inputFieldRef={this.handleInputFieldRef}
                  nativeAmount={nativeAmount}
                  nativeCurrency={nativeCurrency}
                  nativeFieldRef={this.handleNativeFieldRef}
                  onFocus={this.handleFocusField}
                  onPressMaxBalance={this.onPressMaxBalance}
                  onPressSelectInputCurrency={this.handleSelectInputCurrency}
                  setInputAmount={this.setInputAmount}
                  setNativeAmount={this.setNativeAmount}
                />
                <ExchangeOutputField
                  onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                  outputAmount={outputAmount}
                  onFocus={this.handleFocusField}
                  outputCurrency={get(outputCurrency, 'symbol', null)}
                  outputFieldRef={this.handleOutputFieldRef}
                  setOutputAmount={this.setOutputAmount}
                />
              </Column>
            </FloatingPanel>
            <SlippageWarning slippage={slippage} />
            {showConfirmButton && (
              <Fragment>
                <Centered
                  css={padding(19, 15, 0)}
                  flexShrink={0}
                  width="100%"
                >
                  <ConfirmExchangeButton
                    disabled={!Number(inputAmount)}
                    onPress={this.handleSubmit}
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

const withMockedPrices = withProps({
  currencyToDollar: 3,
  targetCurrencyToDollar: 2,
});

export default compose(
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withMockedPrices,
  withNavigationFocus,
  withTransactionConfirmationScreen,
  withTransitionProps,
  mapProps(({
    navigation,
    tabsTransitionProps: {
      isTransitioning: isTabsTransitioning,
    },
    stackTransitionProps: {
      isTransitioning:  isStacksTransitioning,
    },
    ...props,
  }) => ({
    ...props,
    isTransitioning: isStacksTransitioning || isTabsTransitioning,
    navigation,
    transitionPosition: get(navigation, 'state.params.position'),
  })),
)(ExchangeModal);
