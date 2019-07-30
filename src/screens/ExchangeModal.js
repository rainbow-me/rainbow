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
import {
  withAccountData,
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
    inputAmount: PropTypes.number,
    navigation: PropTypes.object,
    outputAmount: PropTypes.number,
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
  }

  keyboardHeight = null

  inputFieldRef = null

  setInputAmount = inputAmount => this.setState({ inputAmount })

  setNativeAmount = nativeAmount => this.setState({ nativeAmount })

  setOutputAmount = outputAmount => this.setState({ outputAmount })

  setInputCurrency = inputCurrency => this.setState({ inputCurrency })

  setOutputCurrency = outputCurrency => this.setState({ outputCurrency })

  handleSelectInputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
      keyboardHeight: this.keyboardHeight,
      onSelectCurrency: this.setInputCurrency,
    });
  }

  handleSelectOutputCurrency = () => {
    this.props.navigation.navigate('CurrencySelectScreen', {
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
  withBlockedHorizontalSwipe,
  withNavigationFocus,
  withMockedPrices,
)(ExchangeModal);
