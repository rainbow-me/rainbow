import {
  tradeEthForExactTokens,
  tradeExactEthForTokens,
  tradeExactTokensForEth,
  tradeExactTokensForTokens,
  tradeTokensForExactEth,
  tradeTokensForExactTokens,
} from '@uniswap/sdk';
import { get, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { compose, withProps } from 'recompact';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import {
  Centered,
  Column,
  ColumnWithMargins,
} from '../components/layout';
import { executeSwap } from '../handlers/uniswap';
import {
  convertAmountFromNativeDisplay,
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
} from '../helpers/utilities';
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withNeverRerender,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../utils';
import FloatingPanels from '../components/expanded-state/FloatingPanels';
import FloatingPanel from '../components/expanded-state/FloatingPanel';
import { Text } from '../components/text';
import {
  ConfirmExchangeButton,
  ExchangeGasFeeButton,
  ExchangeInputField,
  ExchangeOutputField,
} from '../components/exchange';
import GestureBlocker from '../components/GestureBlocker';
import { SheetHandle } from '../components/sheet';

export const exchangeModalBorderRadius = 30;

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
    inputAsExactAmount: PropTypes.bool,
    inputAmount: PropTypes.string,
    inputCurrency: PropTypes.object,
    nativeCurrency: PropTypes.string,
    navigation: PropTypes.object,
    outputAmount: PropTypes.string,
    outputCurrency: PropTypes.object,
    showConfirmButton: PropTypes.bool,
    tradeDetails: PropTypes.object,
  }

  state = {
    inputAmount: null,
    inputCurrency: ethereumUtils.getAsset(this.props.allAssets),
    // keyboardHeight: 0,
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
    slippage: null,
    tradeDetails: null,
  }

  keyboardHeight = null

  inputFieldRef = null

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

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      isInputAssets: true,
      keyboardHeight: this.keyboardHeight,
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      isInputAssets: false,
      keyboardHeight: this.keyboardHeight,
      onSelectCurrency: this.setOutputCurrency,
    });
  }

  handleSubmit = async () => {
    const { tradeDetails } = this.state;
    await executeSwap(tradeDetails);
    this.props.navigation.navigate('ProfileScreen');
  }

  handleWillFocus = () => {
    if (this.state.outputCurrency) {
      this.setState({ showConfirmButton: true });
    }
  }

  handleInputFieldRef = (ref) => {
    this.inputFieldRef = ref;
  }

  handleDidFocus = () => {
    if (this.inputFieldRef) {
      // setTimeout(() => this.inputFieldRef.focus(), 500);
    }
  }

  lolThing = ({ nativeEvent: { layout } }) => {
    if (!this.keyboardHeight) {
      this.keyboardHeight = deviceUtils.dimensions.height - layout.height;// - safeAreaInsetValues.bottom;
    }
  }

  render = () => {
    const { nativeCurrency, onPressConfirmExchange } = this.props;

    const {
      inputAmount,
      inputCurrency,
      nativeAmount,
      outputAmount,
      outputCurrency,
      showConfirmButton,
    } = this.state;

    return (
      <View
        style={{
          ...deviceUtils.dimensions,
          ...position.coverAsObject,
        }}
      >
        <KeyboardAvoidingView behavior="height">
          <View
            onLayout={this.lolThing}
            style={position.coverAsObject}
          />
          <NavigationEvents
            onDidFocus={this.handleDidFocus}
            onWillFocus={this.handleWillFocus}
          />
          <Centered direction="column" {...position.sizeAsObject('100%')} backgroundColor={colors.transparent}>
            <FloatingPanels>
              <GestureBlocker type='top'/>
              <FloatingPanel radius={exchangeModalBorderRadius}>
                <ExchangeModalHeader />
                <Column align="center">
                  <ExchangeInputField
                    autoFocus={true}
                    inputAmount={inputAmount}
                    inputCurrency={get(inputCurrency, 'symbol', null)}
                    nativeCurrency={nativeCurrency}
                    nativeAmount={nativeAmount}
                    onPressSelectInputCurrency={this.handleSelectInputCurrency}
                    refInput={this.handleInputFieldRef}
                    setInputAmount={this.setInputAmount}
                    setNativeAmount={this.setNativeAmount}
                  />
                  <ExchangeOutputField
                    onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                    outputAmount={outputAmount}
                    outputCurrency={get(outputCurrency, 'symbol', null)}
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
            </FloatingPanels>
          </Centered>
        </KeyboardAvoidingView>
      </View>
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
)(ExchangeModal);
