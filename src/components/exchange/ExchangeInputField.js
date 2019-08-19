import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { colors, fonts } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
import {
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Text } from '../text';
import ExchangeInput from './ExchangeInput';
import UnlockAssetButton from './UnlockAssetButton';

export default class ExchangeInputField extends Component {
  static propTypes = {
    inputAmount: PropTypes.string,
    inputCurrency: PropTypes.string,
    inputFieldRef: PropTypes.func,
    isAssetApproved: PropTypes.bool,
    nativeAmount: PropTypes.string,
    nativeCurrency: PropTypes.string,
    nativeFieldRef: PropTypes.func,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.func,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  }

  inputFieldRef = undefined
  nativeFieldRef = undefined

  padding = 15

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewInputAmount = isNewValueForPath(this.props, nextProps, 'inputAmount');
    const isNewInputCurrency = isNewValueForPath(this.props, nextProps, 'inputCurrency');
    const isNewAssetApproved = isNewValueForPath(this.props, nextProps, 'isAssetApproved');
    const isNewNativeAmount = isNewValueForPath(this.props, nextProps, 'nativeAmount');
    const isNewNativeCurrency = isNewValueForPath(this.props, nextProps, 'nativeCurrency');

    return (
      isNewInputAmount
      || isNewInputCurrency
      || isNewAssetApproved
      || isNewNativeAmount
      || isNewNativeCurrency
    )
  }

  handleFocusInputField = () => {
    if (this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  }

  handleFocusNativeField = () => {
    if (this.nativeFieldRef) {
      this.nativeFieldRef.focus();
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

  renderNativeField = () => {
    const {
      nativeAmount,
      nativeCurrency,
      nativeFieldRef,
      onFocus,
      setNativeAmount,
    } = this.props;

    const { mask, placeholder, symbol } = supportedNativeCurrencies[nativeCurrency];

    const symbolColor = (
      !!nativeAmount
        ? colors.dark
        : ExchangeInput.defaultProps.placeholderTextColor
    );

    return (
      <TouchableWithoutFeedback onPress={this.handleFocusNativeField}>
        <Row
          align="center"
          margin={0}
          paddingBottom={this.padding}
        >
          <Text
            color={symbolColor}
            flex={0}
            size="large"
            weight="regular"
          >
            {symbol}
          </Text>
          <ExchangeInput
            disableTabularNums={true}
            fontFamily={fonts.family.SFProText}
            fontSize={fonts.size.large}
            fontWeight={fonts.weight.regular}
            mask={mask}
            onChangeText={setNativeAmount}
            onFocus={onFocus}
            placeholder={placeholder}
            refInput={this.handleNativeFieldRef}
            value={nativeAmount}
          />
        </Row>
      </TouchableWithoutFeedback>
    );
  }

  render = () => {
    const {
      inputAmount,
      inputCurrency,
      isAssetApproved,
      onFocus,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      onPressUnlockAsset,
      setInputAmount,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

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
              <CoinIcon
                bgColor={inputCurrency ? undefined : skeletonColor}
                flex={0}
                size={40}
                symbol={inputCurrency}
              />
              <ExchangeInput
                editable={!!inputCurrency}
                onChangeText={setInputAmount}
                onFocus={onFocus}
                placeholder={inputCurrency ? '0' : EnDash.unicode}
                placeholderTextColor={inputCurrency ? undefined : skeletonColor}
                refInput={this.handleInputFieldRef}
                value={inputAmount}
              />
            </RowWithMargins>
          </TouchableWithoutFeedback>
          <CoolButton
            color={inputCurrency ? colors.dark : colors.appleBlue}
            onPress={onPressSelectInputCurrency}
          >
            {inputCurrency || 'Choose a Coin'}
          </CoolButton>
        </Row>
        <Row
          align="center"
          justify="space-between"
          paddingLeft={this.padding}
        >
          {this.renderNativeField()}
          {isAssetApproved ? (
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
          ) : (
            <UnlockAssetButton onPress={onPressUnlockAsset} />
          )}
        </Row>
      </ColumnWithMargins>
    );
  }
}
