import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableWithoutFeedback } from 'react-native';
import { colors, fonts } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { EnDash } from '../html-entities';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import ExchangeInput from './ExchangeInput';
import ExchangeNativeField from './ExchangeNativeField';

const BottomRowHeight = 32;

export default class ExchangeInputField extends Component {
  static propTypes = {
    inputAmount: PropTypes.string,
    inputCurrencyAddress: PropTypes.string,
    inputCurrencySymbol: PropTypes.string,
    inputFieldRef: PropTypes.func,
    isAssetApproved: PropTypes.bool,
    nativeAmount: PropTypes.string,
    nativeCurrency: PropTypes.string,
    nativeFieldRef: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onPressMaxBalance: PropTypes.func,
    onPressSelectInputCurrency: PropTypes.func,
    setInputAmount: PropTypes.func,
    setNativeAmount: PropTypes.func,
  };

  shouldComponentUpdate = nextProps =>
    isNewValueForObjectPaths(this.props, nextProps, [
      'inputAmount',
      'inputCurrencySymbol',
      'isAssetApproved',
      'nativeAmount',
      'nativeCurrency',
    ]);

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
      inputCurrencyAddress,
      inputCurrencySymbol,
      isAssetApproved,
      nativeAmount,
      nativeCurrency,
      nativeFieldRef,
      onBlur,
      onFocus,
      onPressMaxBalance,
      onPressSelectInputCurrency,
      setInputAmount,
      setNativeAmount,
    } = this.props;

    const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

    return (
      <ColumnWithMargins
        backgroundColor={colors.white}
        flex={0}
        margin={12}
        paddingTop={16}
        width="100%"
        zIndex={1}
      >
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
                address={inputCurrencyAddress}
              />
              <ExchangeInput
                disableTabularNums
                editable={!!inputCurrencySymbol}
                fontFamily={fonts.family.SFProRounded}
                letterSpacing={fonts.letterSpacing.roundedTightest}
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
          <TokenSelectionButton
            onPress={onPressSelectInputCurrency}
            showLockIcon={inputCurrencySymbol && !isAssetApproved}
            symbol={inputCurrencySymbol}
          />
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
          <ButtonPressAnimation marginRight={4} onPress={onPressMaxBalance}>
            <RowWithMargins
              align="center"
              height={BottomRowHeight}
              margin={0}
              paddingHorizontal={this.padding}
            >
              <Emoji
                lineHeight="none"
                name="moneybag"
                style={{ marginTop: 0.5 }}
                size="lmedium"
              />
              <Text
                align="center"
                color="appleBlue"
                size="lmedium"
                style={{ marginTop: 1 }}
                weight="semibold"
              >
                Max
              </Text>
            </RowWithMargins>
          </ButtonPressAnimation>
        </Row>
      </ColumnWithMargins>
    );
  };
}
