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
import { InteractionManager, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationActions, NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps, toClass, withProps } from 'recompact';
import { executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeDisplay,
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

  setNativeAmount = async nativeAmountDisplay => {
    this.setState({ nativeAmount: nativeAmountDisplay });
    const nativeAmount = convertAmountFromNativeDisplay(nativeAmountDisplay, this.props.nativeCurrency);
    const inputAmount = convertAmountFromNativeValue(nativeAmount, get(this.state.inputCurrency, 'native.price.amount', 0));
    this.setState({ inputAmount });
    this.setInputAsExactAmount(true);
    await this.getMarketDetails();
  }

  setInputAmount = async inputAmount => {
    this.setState({ inputAmount });
    const nativeAmount = convertAmountToNativeAmount(inputAmount, get(this.state.inputCurrency, 'native.price.amount', 0));
    this.setState({ nativeAmount });
    this.setInputAsExactAmount(true);
    await this.getMarketDetails();
  }

  setOutputAmount = async outputAmount => {
    this.setState({ outputAmount });
    this.setInputAsExactAmount(false);
    await this.getMarketDetails();
  }

  setInputCurrency = inputCurrency => {
    const previousInputCurrency = this.state.inputCurrency;
    this.setState({ inputCurrency });
    if (inputCurrency && this.state.outputCurrency && inputCurrency.address === this.state.outputCurrency.address) {
      if (this.state.outputCurrency !== null
          && previousInputCurrency !== null) {
        this.setOutputCurrency(previousInputCurrency);
      } else {
        this.setOutputCurrency(null);
      }
    }
  }

  setOutputCurrency = outputCurrency => {
    const previousOutputCurrency = this.state.outputCurrency;
    this.setState({ outputCurrency });
    if (outputCurrency && this.state.inputCurrency && outputCurrency.address === this.state.inputCurrency.address) {
      const asset = ethereumUtils.getAsset(this.props.allAssets, address);
      if (this.state.inputCurrency !== null && previousOutputCurrency !== null && !isNil(asset)) {
        this.setInputCurrency(previousOutputCurrency);
      } else {
        this.setInputCurrency(null);
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
    const { tradeDetails } = this.state;
    try {
      const txn = await executeSwap(tradeDetails);
      if (txn) {
        const txnDetails = {
          amount: this.state.inputAmount,
          asset: this.state.inputCurrency,
          from: this.props.accountAddress,
          hash: txn.hash,
          nonce: get(txn, 'nonce'),
          to: get(txn, 'to'),
        };
        this.props.dataAddNewTransaction(txnDetails);
        this.props.navigation.navigate('ProfileScreen');
      } else {
        this.props.navigation.navigate('ProfileScreen');
      }
    } catch (error) {
      console.log('error submitting swap', error);
      this.props.navigation.navigate('WalletScreen');
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
          paddingTop={showConfirmButton ? 0 : 10}
        >
          <AnimatedFloatingPanels
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
              <Column align="center">
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
            <Centered>
              <Text color={colors.white}>
                Slippage {this.state.slippage}
              </Text>
            </Centered>
            <GestureBlocker type='bottom'/>
            {showConfirmButton && (
              <Fragment>
                <Centered css={padding(0, 15, 24)} width="100%">
                  <ConfirmExchangeButton
                    disabled={!Number(inputAmount)}
                    onPress={this.handleSubmit}
                  />
                </Centered>
                {!!Number(inputAmount) && (
                  <ExchangeGasFeeButton
                    gasPrice={'$0.06'}
                  />
                )}
              </Fragment>
            )}
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
    transitionProps: { isTransitioning },
    ...props,
  }) => ({
    ...props,
    isTransitioning,
    navigation,
    transitionPosition: get(navigation, 'state.params.position'),
  })),
)(ExchangeModal);
