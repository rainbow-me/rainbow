import {
  tradeEthForExactTokens,
  tradeExactEthForTokens,
  tradeExactTokensForEth,
  tradeExactTokensForTokens,
  tradeTokensForExactEth,
  tradeTokensForExactTokens,
} from '@uniswap/sdk';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, toClass, withProps } from 'recompact';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
} from '../helpers/utilities';
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withNeverRerender,
  withTransitionProps,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import {
  ConfirmExchangeButton,
  ExchangeGasFeeButton,
  ExchangeInputField,
  ExchangeOutputField,
} from '../components/exchange';
import { FloatingPanel, FloatingPanels } from '../components/expanded-state';
import GestureBlocker from '../components/GestureBlocker';
import {
  Centered,
  Column,
  ColumnWithMargins,
  KeyboardFixedOpenLayout,
} from '../components/layout';
import { SheetHandle } from '../components/sheet';
import { Text } from '../components/text';

export const exchangeModalBorderRadius = 30;

const AnimatedFloatingPanels = Animated.createAnimatedComponent(toClass(FloatingPanels));

const ExchangeModalHeader = withNeverRerender(() => (
  <ColumnWithMargins
    align="center"
    css={padding(9, 0)}
    margin={6}
  >
    <SheetHandle />
    <Text
      letterSpacing="tighter"
      lineHeight="loose"
      size="large"
      weight="bold"
    >
      Swap
    </Text>
  </ColumnWithMargins>
));

class ExchangeModal extends PureComponent {
  static propTypes = {
    allAssets: PropTypes.array,
    chainId: PropTypes.number,
    clearKeyboardFocusHistory: PropTypes.func,
    keyboardFocusHistory: PropTypes.array,
    navigation: PropTypes.object,
    pushKeyboardFocusHistory: PropTypes.func,
  }

  state = {
    inputAmount: null,
    inputAsExactAmount: false,
    inputCurrency: 'ETH',
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
    slippage: null,
  }

  componentDidMount = () => {
    // console.log('componentDidMount dangerouslyGetParent', this.props.navigation.dangerouslyGetParent())
    // console.log('this.props.navigation', this.props.navigation);
  }

  componentDidUpdate = (prevProps) => {
    const {
      isFocused,
      keyboardFocusHistory,
      transitionProps: { isTransitioning },
    } = this.props;

    const prevTransitioning = get(prevProps, 'transitionProps.isTransitioning');

    if (isFocused && (!isTransitioning && prevTransitioning)) {
      const lastFocusedInput = keyboardFocusHistory[keyboardFocusHistory.length - 2];

      if (lastFocusedInput) {
        TextInput.State.focusTextInput(lastFocusedInput);
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
      const {
        address: inputCurrencyAddress,
        decimals: inputDecimals,
      } = inputCurrency;
      const {
        address: outputCurrencyAddress,
        decimals: outputDecimals,
      } = outputCurrency;
      const rawInputAmount = convertAmountToRawAmount(inputAmount, inputDecimals);
      const rawOutputAmount = convertAmountToRawAmount(outputAmount, outputDecimals);

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
      } if (inputAsExactAmount) {
        // TODO reuse
        const updatedValue = get(tradeDetails, 'outputAmount.amount');
        const slippage = get(tradeDetails, 'marketRateSlippage');
        const rawUpdatedValue = convertRawAmountToDecimalFormat(updatedValue, outputDecimals);
        this.setState({ outputAmount: rawUpdatedValue, slippage });
      } else {
        const updatedValue = get(tradeDetails, 'inputAmount.amount');
        const slippage = get(tradeDetails, 'marketRateSlippage');
        const rawUpdatedValue = convertRawAmountToDecimalFormat(updatedValue, inputDecimals);
        this.setState({ inputAmount: rawUpdatedValue, slippage });
      }
    } catch (error) {
      console.log('error getting market details', error);
      // TODO
    }
  }

  setInputAsExactAmount = (inputAsExactAmount) => this.setState({ inputAsExactAmount })

  setNativeAmount = async nativeAmount => {
    this.setState({ nativeAmount });
    const inputAmount = convertAmountFromNativeValue(nativeAmount, get(this.inputCurrency, 'native.price.amount', 0));
    this.setState({ inputAmount });
    setInputAsExactAmount(true);
    await getMarketDetails();
  }

  setInputAmount = async inputAmount => {
    this.setState({ inputAmount });
    const nativeAmount = convertAmountToNativeAmount(inputAmount, get(this.inputCurrency, 'native.price.amount', 0));
    this.setState({ nativeAmount });
    setInputAsExactAmount(true);
    await getMarketDetails();
  }

  setOutputAmount = async outputAmount => {
    this.setState({ outputAmount });
    setInputAsExactAmount(false);
    await getMarketDetails();
  }

  setInputCurrency = inputCurrency => {
    const previousInputCurrency = this.inputCurrency;
    this.setState({ inputCurrency });
    if (inputCurrency.address === this.outputCurrency.address) {
      if (this.outputCurrency !== null
          && previousInputCurrency !== null) {
        this.setOutputCurrency(previousInputCurrency);
      } else {
        this.setOutputCurrency(null);
      }
    }
  }

  setOutputCurrency = outputCurrency => {
    // TODO check that it is valid input currency
    const previousOutputCurrency = this.outputCurrency;
    this.setState({ outputCurrency })
    if (outputCurrency.address === this.inputCurrency.address) {
      if (this.inputCurrency !== null
          && previousOutputCurrency !== null) {
        this.setInputCurrency(previousOutputCurrency);
      } else {
        this.setInputCurrency(null);
      }
    }
  }

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      isInputAssets: true,
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      isInputAssets: false,
      onSelectCurrency: this.setOutputCurrency,
    });
  }

  handleSubmit = () => {
    this.props.navigation.navigate('WalletScreen');
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
      onPressConfirmExchange,
      navigation,
      transitionProps,
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
              opacity: Animated.interpolate(navigation.getParam('position'), {
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
                  inputCurrency={inputCurrency}
                  nativeAmount={nativeAmount}
                  inputFieldRef={this.handleInputFieldRef}
                  nativeFieldRef={this.handleNativeFieldRef}
                  onFocus={this.handleFocusField}
                  onPressSelectInputCurrency={this.handleSelectInputCurrency}
                  setInputAmount={this.setInputAmount}
                  setNativeAmount={this.setNativeAmount}
                />
                <ExchangeOutputField
                  onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                  outputAmount={outputAmount}
                  onFocus={this.handleFocusField}
                  outputCurrency={outputCurrency}
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
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withNavigationFocus,
  withMockedPrices,
  withKeyboardFocusHistory,
  withTransitionProps,
)(ExchangeModal);
