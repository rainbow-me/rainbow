import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { compose, withProps } from 'recompact';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import {
  tradeEthForExactTokens,
  tradeExactEthForTokens,
  tradeExactTokensForEth,
  tradeExactTokensForTokens,
  tradeTokensForExactEth,
  tradeTokensForExactTokens,
} from '@uniswap/sdk';
import {
  Centered,
  Column,
  ColumnWithMargins,
} from '../components/layout';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
} from '../helpers/utilities';
import {
  withAccountData,
  withAccountSettings,
  withBlockedHorizontalSwipe,
  withNeverRerender,
} from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';
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
    inputAmount: PropTypes.number,
    inputCurrency: PropTypes.object,
    navigation: PropTypes.object,
    outputAmount: PropTypes.number,
    outputCurrency: PropTypes.object,
    showConfirmButton: PropTypes.bool,
  }

  state = {
    inputAmount: null,
    inputCurrency: 'ETH',
    // keyboardHeight: 0,
    nativeAmount: null,
    outputAmount: null,
    outputCurrency: null,
    showConfirmButton: false,
    slippage: null,
  }

  keyboardHeight = null

  inputFieldRef = null

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

  setNativeAmount = nativeAmount => {
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

  handleSubmit = () => {
    this.props.navigation.navigate('WalletScreen');
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
    const { onPressConfirmExchange } = this.props;

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
                    inputCurrency={inputCurrency}
                    nativeAmount={nativeAmount}
                    onPressSelectInputCurrency={this.handleSelectInputCurrency}
                    refInput={this.handleInputFieldRef}
                    setInputAmount={this.setInputAmount}
                    setNativeAmount={this.setNativeAmount}
                  />
                  <ExchangeOutputField
                    onPressSelectOutputCurrency={this.handleSelectOutputCurrency}
                    outputAmount={outputAmount}
                    outputCurrency={outputCurrency}
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
