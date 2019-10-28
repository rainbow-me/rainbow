import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoolButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import ExchangeInput from './ExchangeInput';
import ExchangeNativeField from './ExchangeNativeField';
import UnlockAssetButton from './UnlockAssetButton';

const BottomRowHeight = 32;

export default class ExchangeInputField extends Component {
  static propTypes = {
    inputAmount: PropTypes.string,
    inputCurrencySymbol: PropTypes.string,
    inputFieldRef: PropTypes.func,
    isAssetApproved: PropTypes.bool,
    isUnlockingAsset: PropTypes.bool,
    nativeAmount: PropTypes.string,
    nativeCurrency: PropTypes.string,
    nativeFieldRef: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.func,
    onUnlockAsset: PropTypes.func,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  };

  shouldComponentUpdate = nextProps => {
    const isNewAssetApproved = isNewValueForPath(
      this.props,
      nextProps,
      'isAssetApproved'
    );
    const isNewInputAmount = isNewValueForPath(
      this.props,
      nextProps,
      'inputAmount'
    );
    const isNewInputCurrency = isNewValueForPath(
      this.props,
      nextProps,
      'inputCurrencySymbol'
    );
    const isNewNativeAmount = isNewValueForPath(
      this.props,
      nextProps,
      'nativeAmount'
    );
    const isNewNativeCurrency = isNewValueForPath(
      this.props,
      nextProps,
      'nativeCurrency'
    );
    const isNewUnlockingAsset = isNewValueForPath(
      this.props,
      nextProps,
      'isUnlockingAsset'
    );

    return (
      isNewAssetApproved ||
      isNewInputAmount ||
      isNewInputCurrency ||
      isNewNativeAmount ||
      isNewNativeCurrency ||
      isNewUnlockingAsset
    );
  };

  inputFieldRef = undefined;

  padding = 15;

  handleFocusInputField = () => {
    if (this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  };

  handleInputFieldRef = ref => {
    this.inputFieldRef = ref;
    this.props.inputFieldRef(ref);
  };

  render = () => {
    const {
      inputAmount,
      inputCurrencySymbol,
      isAssetApproved,
      isUnlockingAsset,
      nativeAmount,
      nativeCurrency,
      nativeFieldRef,
      onBlur,
      onFocus,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      onUnlockAsset,
      setInputAmount,
      setNativeAmount,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

    return (
      <ColumnWithMargins flex={0} margin={12} width="100%">
        <Row align="center">
          <TouchableWithoutFeedback onPress={this.handleFocusInputField}>
            <RowWithMargins
              align="center"
              flex={1}
              margin={10}
              paddingLeft={this.padding}
            >
              <CoinIcon
                bgColor={inputCurrencySymbol ? undefined : skeletonColor}
                flex={0}
                size={40}
                symbol={inputCurrencySymbol}
              />
              <ExchangeInput
                autoFocus
                editable={!!inputCurrencySymbol}
                onChangeText={setInputAmount}
                onBlur={onBlur}
                onFocus={onFocus}
                placeholder={inputCurrencySymbol ? '0' : EnDash.unicode}
                placeholderTextColor={
                  inputCurrencySymbol ? undefined : skeletonColor
                }
                refInput={this.handleInputFieldRef}
                value={inputAmount}
              />
            </RowWithMargins>
          </TouchableWithoutFeedback>
          <CoolButton
            color={inputCurrencySymbol ? colors.dark : colors.appleBlue}
            onPress={onPressSelectInputCurrency}
          >
            {inputCurrencySymbol || 'Choose a Coin'}
          </CoolButton>
        </Row>
        <Row
          align="center"
          height={BottomRowHeight}
          justify="space-between"
          paddingLeft={this.padding}
        >
          <ExchangeNativeField
            height={BottomRowHeight}
            nativeAmount={nativeAmount}
            nativeCurrency={nativeCurrency}
            nativeFieldRef={nativeFieldRef}
            onBlur={onBlur}
            onFocus={onFocus}
            setNativeAmount={setNativeAmount}
          />
          {isAssetApproved || isUnlockingAsset ? (
            <ButtonPressAnimation marginRight={4} onPress={onPressMaxBalance}>
              <RowWithMargins
                align="center"
                height={BottomRowHeight}
                margin={0}
                paddingHorizontal={this.padding}
              >
                <Emoji lineHeight="none" name="moneybag" size="lmedium" />
                <Text color="appleBlue" size="medium" weight="semibold">
                  Max
                </Text>
              </RowWithMargins>
            </ButtonPressAnimation>
          ) : (
            <UnlockAssetButton onPress={onUnlockAsset} />
          )}
        </Row>
      </ColumnWithMargins>
    );
  };
}
