import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/primitives';
import { ExchangeContext } from '../../navigation/config';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';
import { colors, fonts } from '@rainbow-me/styles';

const CurrencySymbol = styled(Text).attrs(({ height }) => ({
  letterSpacing: 'roundedTight',
  lineHeight: height,
  size: 'larger',
  weight: 'regular',
}))``;

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.larger,
  weight: fonts.weight.regular,
})`
  height: ${({ height }) => height};
`;

const ExchangeNativeField = (
  {
    editable,
    height,
    nativeAmount,
    nativeCurrency,
    onFocus,
    setNativeAmount,
    testID,
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency
  ];
  const isRouteFocused = useIsFocused();
  const { startedTransition } = useContext(ExchangeContext);

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
        <CurrencySymbol color={nativeAmountColor} height={height}>
          {symbol}
        </CurrencySymbol>
        <NativeInput
          color={nativeAmountColor}
          editable={editable && (isRouteFocused || startedTransition)}
          height={height}
          mask={mask}
          onBlur={handleBlur}
          onChangeText={setNativeAmount}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          testID={nativeAmount ? `${testID}-${nativeAmount}` : testID}
          value={nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
