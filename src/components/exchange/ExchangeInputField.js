import React, { PureComponent } from 'react';
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

export default class ExchangeInputField extends PureComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    inputAmount: PropTypes.string,
    inputCurrency: PropTypes.string,
    inputFieldRef: PropTypes.func,
    nativeAmount: PropTypes.string,
    nativeFieldRef: PropTypes.func,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.string,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  }

  inputFieldRef = undefined
  nativeFieldRef = undefined

  padding = 15

  handleFocusInputField = () => {
    if (this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  }

  handleInputFieldRef = (ref) => {
    this.inputFieldRef = ref;
    this.props.inputFieldRef(ref);
  }

  handleNativeFieldRef = (ref) => {
    this.nativeFieldRef = ref;
    this.props.nativeFieldRef(ref);
  }

  render = () => {
    const {
      autoFocus,
      inputAmount,
      inputCurrency,
      inputFieldRef,
      onFocus,
      nativeAmount,
      nativeFieldRef,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      setInputAmount,
      setNativeAmount,
    } = this.props;

    // mask="[0...][-][9...]"
    //
    return (
      <ColumnWithMargins flex={0} margin={14.5} width="100%">
        <Row align="center">
          <TouchableWithoutFeedback onPress={this.handleFocusInputField}>
            <RowWithMargins
              align="center"
              flex={1}
              margin={11}
              paddingLeft={this.padding}
            >
              <CoinIcon size={31} symbol={inputCurrency} />
              <Row align="center" flex={1}>
                <ExchangeInput
                  onChangeText={setInputAmount}
                  onFocus={onFocus}
                  refInput={this.handleInputFieldRef}
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
            mask="{$}[099999999999]{.}[00]"
            onChangeText={setNativeAmount}
            onFocus={onFocus}
            placeholder="$0.00"
            refInput={this.handleNativeFieldRef}
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
