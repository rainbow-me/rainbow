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
import { TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, toClass, withProps } from 'recompact';
import { executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeDisplay,
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
} from '../helpers/utilities';
import {
  withAccountAddress,
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withKeyboardFocusHistory,
  withNeverRerender,
  withTransactionConfirmationScreen,
  withTransitionProps,
  withUniswapAssets,
} from '../hoc';
import uniswapAssets from '../references/uniswap-pairs.json';
import { colors, padding, position } from '../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../utils';
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
    dataAddNewTransaction: PropTypes.func,
    keyboardFocusHistory: PropTypes.array,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    pushKeyboardFocusHistory: PropTypes.func,
    sortedUniswapAssets: PropTypes.array,
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

  getAssetsAvailableOnUniswap = () => {
    const uniswapAssetAddresses = map(keys(uniswapAssets), address => address.toLowerCase());
    return filter(this.props.allAssets, asset => findIndex(uniswapAssetAddresses, uniswapAddress => uniswapAddress === asset.address) > -1);
  };

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      assets: this.getAssetsAvailableOnUniswap(),
      isInputAssets: true,
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      assets: this.props.sortedUniswapAssets,
      isInputAssets: false,
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
                  inputCurrency={get(inputCurrency, 'symbol', null)}
                  inputFieldRef={this.handleInputFieldRef}
                  nativeAmount={nativeAmount}
                  nativeCurrency={nativeCurrency}
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
  withTransactionConfirmationScreen,
  withUniswapAssets,
  withNavigationFocus,
  withMockedPrices,
  withKeyboardFocusHistory,
  withTransitionProps,
)(ExchangeModal);
