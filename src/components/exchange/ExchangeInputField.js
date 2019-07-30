import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import {
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Text } from '../text';
import ExchangeInput from './ExchangeInput';

export default class ExchangeInputField extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    inputAmount: PropTypes.string,
    inputCurrency: PropTypes.string,
    nativeAmount: PropTypes.string,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.string,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  }

  inputRef = React.createRef()

  maskRef = null

  dollarRef = null

  padding = 15

  handleFocusInput = () => {
    if (this.maskRef) {
      this.maskRef.focus();
    }
  }


  handleMaskRef = (ref) => {
    this.maskRef = ref;
  }

  handleDollarRef = (ref) => {
    this.dollarRef = ref;
  }

  render = () => {
    const {
      autoFocus,
      inputAmount,
      inputCurrency,
      nativeAmount,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      setInputAmount,
      setNativeAmount,
    } = this.props;


    // mask="[0...][-][9...]"

    return (
      <ColumnWithMargins flex={0} margin={14.5} width="100%">
        <Row align="center">
          <TouchableWithoutFeedback onPress={this.handleFocusInput}>
            <RowWithMargins
              align="center"
              flex={1}
              margin={11}
              paddingLeft={this.padding}
            >
              <CoinIcon
                size={31}
                symbol={inputCurrency}
              />
              <Row align="center" flex={1}>
                <ExchangeInput
                  autoFocus={autoFocus}
                  refInput={this.props.refInput}
                  onChangeText={setInputAmount}
                  value={inputAmount}
                />
              </Row>
            </RowWithMargins>
          </TouchableWithoutFeedback>
          <CoolButton
            color={inputCurrency ? colors.dark : colors.appleBlue}
            onPress={onPressSelectInputCurrency}
          >
            {inputCurrency || 'Choose a Coin'}
          </CoolButton>
        </Row>
        <Row align="center" justify="space-between" paddingLeft={this.padding}>
          <ExchangeInput
            fontSize={fonts.size.large}
            inputRef={this.handleDollarRef}
            mask="{$}[099999999999]{.}[00]"
            onChangeText={setNativeAmount}
            placeholder="$0.00"
            style={{ paddingBottom: this.padding }}
            value={nativeAmount}
          />
          <ButtonPressAnimation onPress={onPressMaxBalance}>
            <RowWithMargins
              align="center"
              margin={3}
              paddingHorizontal={this.padding}
            >
              <Emoji lineHeight="none" name="moneybag" size="lmedium" />
              <Text color="appleBlue" size="medium" weight="semibold">Max</Text>
            </RowWithMargins>
          </ButtonPressAnimation>
        </Row>
      </ColumnWithMargins>
    );
  }
}
