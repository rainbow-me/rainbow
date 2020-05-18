import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/primitives';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { colors, fonts } from '../../styles';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';

const CurrencySymbol = styled(Text).attrs({
  size: 'large',
  weight: 'regular',
})`
  margin-bottom: 0.5;
`;

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.large,
  weight: fonts.weight.regular,
})`
  height: ${({ height }) => height};
`;

const ExchangeNativeField = (
  { editable, height, nativeAmount, nativeCurrency, onFocus, setNativeAmount },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency
  ];

  const handleFocusNativeField = useCallback(() => ref?.current?.focus(), [
    ref,
  ]);

  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleFocus = useCallback(
    event => {
      setIsFocused(true);
      if (onFocus) onFocus(event);
    },
    [onFocus]
  );

  const nativeAmountExists =
    typeof nativeAmount === 'string' && nativeAmount.length > 0;

  const nativeAmountColor = colors.alpha(
    isFocused ? colors.dark : colors.blueGreyDark,
    isFocused ? 1 : nativeAmountExists ? 0.5 : 0.3
  );

  return (
    <TouchableWithoutFeedback onPress={handleFocusNativeField}>
      <Row align="center" flex={1} height={height}>
        <CurrencySymbol color={nativeAmountColor}>{symbol}</CurrencySymbol>
        <NativeInput
          color={nativeAmountColor}
          editable={editable}
          height={height}
          mask={mask}
          onBlur={handleBlur}
          onChangeText={setNativeAmount}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          value={nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

ExchangeNativeField.propTypes = {
  editable: PropTypes.bool,
  height: PropTypes.number,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onFocus: PropTypes.func,
  setNativeAmount: PropTypes.func,
};

export default React.forwardRef(ExchangeNativeField);
