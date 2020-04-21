import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { colors, fonts } from '../../styles';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';

const sx = StyleSheet.create({
  text: {
    marginBottom: 0.5,
  },
});

const ExchangeNativeField = ({
  assignNativeFieldRef,
  editable,
  height,
  nativeAmount,
  nativeCurrency,
  onBlur,
  onFocus,
  setNativeAmount,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency
  ];

  const nativeFieldRef = useRef();

  const focusNativeField = useCallback(() => {
    if (nativeFieldRef && nativeFieldRef.current) {
      nativeFieldRef.current.focus();
    }
  }, []);

  const handleBlur = useCallback(
    event => {
      setIsFocused(false);

      if (onBlur) {
        onBlur(event);
      }
    },
    [onBlur]
  );

  const handleFocus = useCallback(
    event => {
      setIsFocused(true);

      if (onFocus) {
        onFocus(event);
      }
    },
    [onFocus]
  );

  const handleNativeFieldRef = useCallback(
    ref => {
      nativeFieldRef.current = ref;
      assignNativeFieldRef(ref);
    },
    [assignNativeFieldRef]
  );

  const nativeAmountExists =
    typeof nativeAmount === 'string' && nativeAmount.length > 0;

  let opacity = nativeAmountExists ? 0.5 : 0.3;
  if (isFocused) {
    opacity = 1;
  }

  const color = colors.alpha(
    isFocused ? colors.dark : colors.blueGreyDark,
    opacity
  );

  return (
    <TouchableWithoutFeedback flex={0} onPress={focusNativeField}>
      <Row align="center" flex={1} height={height}>
        <Text
          color={color}
          flex={0}
          size="large"
          style={sx.text}
          weight="regular"
        >
          {symbol}
        </Text>
        <ExchangeInput
          color={color}
          disableTabularNums
          editable={editable}
          fontSize={fonts.size.large}
          fontWeight={fonts.weight.regular}
          letterSpacing={fonts.letterSpacing.roundedTight}
          mask={mask}
          onBlur={handleBlur}
          onChangeText={setNativeAmount}
          onFocus={handleFocus}
          placeholder={placeholder}
          refInput={handleNativeFieldRef}
          value={nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

ExchangeNativeField.propTypes = {
  assignNativeFieldRef: PropTypes.func,
  editable: PropTypes.bool,
  height: PropTypes.number,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  setNativeAmount: PropTypes.func,
};

export default ExchangeNativeField;
