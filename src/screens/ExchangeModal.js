import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import {
  Dimensions,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  TextInput,
  View,
} from 'react-native';
import { compose, toClass, withProps } from 'recompact';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
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
    clearKeyboardFocusHistory: PropTypes.func,
    inputAmount: PropTypes.number,
    keyboardFocusHistory: PropTypes.array,
    navigation: PropTypes.object,
    outputAmount: PropTypes.number,
    pushKeyboardFocusHistory: PropTypes.func,
    showConfirmButton: PropTypes.bool,
  }

  state = {
    inputAmount: null,
    inputCurrency: 'ETH',
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
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

  setInputAmount = inputAmount => this.setState({ inputAmount })

  setNativeAmount = nativeAmount => this.setState({ nativeAmount })

  setOutputAmount = outputAmount => this.setState({ outputAmount })

  setInputCurrency = inputCurrency => this.setState({ inputCurrency })

  setOutputCurrency = outputCurrency => this.setState({ outputCurrency })

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
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
            <GestureBlocker type='bottom'/>
            {showConfirmButton && (
              <Fragment>
                <View css={padding(0, 15, 24)} width="100%">
                  <ConfirmExchangeButton
                    disabled={!Number(inputAmount)}
                    onPress={this.handleSubmit}
                  />
                </View>
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
  withState('useInputAsExactAmount', 'setUseInputAsExactAmount', null),
  withState('amountToExchange', 'setAmountToExchange', '0'),
  withState('targetAmountToExchange', 'setTargetAmountToExchange', '0'),
  withState('selectedCurrency', 'setSelectedCurrency', null),
  withState('selectedTargetCurrency', 'setSelectedTargetCurrency', null),
  withProps(({
    selectedCurrency,
    allAssets: [{ symbol }],
  }) => ({ selectedCurrency: selectedCurrency || symbol })),
  withHandlers({
    getMarketDetails: ({
      chainId,
      selectedCurrency,
      selectedTargetCurrency,
      setAmountToExchange,
      setTargetAmountToExchange,
      useInputAsExactAmount,
    }) => async () => {
      try {
        // TODO format amounts
        let tradeDetails = null;
        // normal amount to raw amount (no pricing)
        // convertAmountToRawAmount(amountToExchange, selectedCurrency's decimals);
        
        if (selectedCurrency === null || selectedTargetCurrency === null || useInputAsExactAmount === null) return;
        if (selectedCurrency === 'eth' && selectedTargetCurrency !== 'eth') {
          tradeDetails = useInputAsExactAmount
            ? await tradeExactEthForTokens(selectedTargetCurrency, amountToExchange, chainId)
            : await tradeEthForExactTokens(selectedTargetCurrency, targetAmountToExchange, chainId);
        } else if (selectedCurrency !== 'eth' && selectedTargetCurrency === 'eth') {
          tradeDetails = useInputAsExactAmount
            ? await tradeExactTokensForEth(selectedCurrency, amountToExchange, chainId)
            : await tradeTokensForExactEth(selectedCurrency, targetAmountToExchange, chainId);
        } else if (selectedCurrency !== 'eth' && selectedTargetCurrency !== 'eth') {
          tradeDetails = useInputAsExactAmount
            ? await tradeExactTokensForTokens(selectedCurrency, selectedTargetCurrency, amountToExchange, chainId)
            : await tradeTokensForExactTokens(selectedCurrency, selectedTargetCurrency, targetAmountToExchange, chainId);
        }
        if (useInputAsExactAmount) {
          // TODO format amounts
          const updatedValue = get(tradeDetails, 'outputAmount.amount');
          setTargetAmountToExchange(updatedValue);
        } else {
          // TODO format amounts
          const updatedValue = get(tradeDetails, 'inputAmount.amount');
          setAmountToExchange(updatedValue);
        }
      } catch (error) {
        // TODO
      }
    },
  }),
  withHandlers({
    onPressConfirmExchange:
      ({ navigation }) => () => {
        Keyboard.dismiss();
        navigation.navigate('WalletScreen');
      },
    onChangeInputAmount: ({ getMarketDetails, setAmountToExchange, setUseInputAsExactAmount }) => async (amount) => {
      setAmountToExchange(amount);
      setUseInputAsExactAmount(true);
      await getMarketDetails();
    },
    onChangeTargetAmount: ({ getMarketDetails, setTargetAmountToExchange, setUseInputAsExactAmount }) => async (amount) => {
      setTargetAmountToExchange(amount);
      setUseInputAsExactAmount(false);
      await getMarketDetails();
    },
    onPressSelectCurrency: ({ navigation, setSelectedCurrency }) => () => {
      Keyboard.dismiss();
      navigation.navigate('CurrencySelectScreen', { setSelectedCurrency });
    },
    onPressSelectTargetCurrency:
      ({ navigation, setSelectedTargetCurrency }) => () => {
        Keyboard.dismiss();
        navigation.navigate('CurrencySelectScreen', { setSelectedCurrency: setSelectedTargetCurrency });
      },
  }),
  withBlockedHorizontalSwipe,
  withNavigationFocus,
  withMockedPrices,
  withKeyboardFocusHistory,
  withTransitionProps,
)(ExchangeModal);
