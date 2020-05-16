import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { TokenSelectionButton } from '../buttons';
import { CoinIcon } from '../coin-icon';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, EnDash, Text } from '../text';
import ExchangeInput from './ExchangeInput';
import ExchangeNativeField from './ExchangeNativeField';

const BottomRowHeight = 32;
const padding = 15;
const skeletonColor = colors.alpha(colors.blueGreyDark, 0.1);

const sx = StyleSheet.create({
  maxEmoji: {
    marginTop: 0.5,
  },
  maxLabel: {
    marginTop: 1,
  },
});

const ExchangeInputField = ({
  assignInputFieldRef,
  assignNativeFieldRef,
  disableInputCurrencySelection,
  inputAmount,
  inputCurrencyAddress,
  inputCurrencySymbol,
  nativeAmount,
  nativeCurrency,
  onBlur,
  onFocus,
  onPressMaxBalance,
  onPressSelectInputCurrency,
  setInputAmount,
  setNativeAmount,
}) => {
  const inputFieldRef = useRef();

  const handleFocusInputField = useCallback(() => {
    if (inputFieldRef && inputFieldRef.current) {
      inputFieldRef.current.focus();
    }
  }, []);

  const handleInputFieldRef = useCallback(
    ref => {
      inputFieldRef.current = ref;
      assignInputFieldRef(ref);
    },
    [assignInputFieldRef]
  );

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
        <TouchableWithoutFeedback onPress={handleFocusInputField}>
          <RowWithMargins
            align="center"
            flex={1}
            margin={10}
            paddingLeft={padding}
            paddingRight={disableInputCurrencySelection ? padding : null}
          >
            <CoinIcon
              address={inputCurrencyAddress}
              bgColor={inputCurrencySymbol ? undefined : skeletonColor}
              flex={0}
              size={40}
              symbol={inputCurrencySymbol}
            />
            <ExchangeInput
              disableTabularNums
              editable={!!inputCurrencySymbol}
              height={40}
              letterSpacing={fonts.letterSpacing.roundedTightest}
              onBlur={onBlur}
              onChangeText={setInputAmount}
              onFocus={onFocus}
              placeholder={inputCurrencySymbol ? '0' : EnDash.unicode}
              placeholderTextColor={
                inputCurrencySymbol ? undefined : skeletonColor
              }
              refInput={handleInputFieldRef}
              value={inputAmount}
            />
          </RowWithMargins>
        </TouchableWithoutFeedback>
        {!disableInputCurrencySelection && (
          <TokenSelectionButton
            onPress={onPressSelectInputCurrency}
            symbol={inputCurrencySymbol}
          />
        )}
      </Row>
      <Row
        align="center"
        height={BottomRowHeight}
        justify="space-between"
        paddingLeft={padding}
      >
        <ExchangeNativeField
          assignNativeFieldRef={assignNativeFieldRef}
          editable={!!inputCurrencySymbol}
          height={BottomRowHeight}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onBlur={onBlur}
          onFocus={onFocus}
          setNativeAmount={setNativeAmount}
        />
        <ButtonPressAnimation
          disabled={!inputCurrencySymbol}
          marginRight={4}
          onPress={onPressMaxBalance}
        >
          <RowWithMargins
            align="center"
            height={BottomRowHeight}
            margin={0}
            paddingHorizontal={padding}
          >
            <Emoji
              lineHeight="none"
              name="moneybag"
              size="lmedium"
              style={sx.maxEmoji}
            />
            <Text
              align="center"
              color="appleBlue"
              size="lmedium"
              style={sx.maxLabel}
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

ExchangeInputField.propTypes = {
  assignInputFieldRef: PropTypes.func,
  assignNativeFieldRef: PropTypes.func,
  disableInputCurrencySelection: PropTypes.bool,
  inputAmount: PropTypes.string,
  inputCurrencyAddress: PropTypes.string,
  inputCurrencySymbol: PropTypes.string,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onPressMaxBalance: PropTypes.func,
  onPressSelectInputCurrency: PropTypes.func,
  setInputAmount: PropTypes.func,
  setNativeAmount: PropTypes.func,
};

export default ExchangeInputField;
