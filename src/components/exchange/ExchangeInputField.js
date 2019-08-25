import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors } from '../../styles';
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
import ExchangeNativeField from './ExchangeNativeField';
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
    onFocus: PropTypes.func,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.func,
    onPressUnlockAsset: PropTypes.func,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  }

  inputFieldRef = undefined

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
    );
  }

  handleFocusInputField = () => {
    if (this.inputFieldRef) {
      this.inputFieldRef.focus();
    }
  }

  handleInputFieldRef = (ref) => {
    this.inputFieldRef = ref;
    this.props.inputFieldRef(ref);
  }

  render = () => {
    const {
      inputAmount,
      inputCurrency,
      isAssetApproved,
      nativeAmount,
      nativeCurrency,
      nativeFieldRef,
      onFocus,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      onPressUnlockAsset,
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
          height={32}
          justify="space-between"
          paddingLeft={this.padding}
        >
          <ExchangeNativeField
            height={32}
            nativeAmount={nativeAmount}
            nativeCurrency={nativeCurrency}
            nativeFieldRef={nativeFieldRef}
            onFocus={onFocus}
            setNativeAmount={setNativeAmount}
          />
          {isAssetApproved ? (
            <ButtonPressAnimation
              marginRight={4}
              onPress={onPressMaxBalance}
            >
              <RowWithMargins
                align="center"
                height={32}
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
