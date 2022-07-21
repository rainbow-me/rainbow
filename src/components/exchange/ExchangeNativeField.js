import React, { useCallback, useMemo, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { useDebounce } from 'use-debounce';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';
import { useColorForAsset, useTimeout } from '@rainbow-me/hooks';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import styled from '@rainbow-me/styled-components';
import { fonts } from '@rainbow-me/styles';

const CurrencySymbol = styled(Text).attrs(({ height, color }) => ({
  color: color,
  letterSpacing: 'roundedTight',
  lineHeight: height,
  size: 'larger',
  weight: 'regular',
}))(android ? { marginBottom: 1.5 } : {});

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.larger,
  weight: fonts.weight.regular,
})({
  height: ({ height }) => height,
});

const ExchangeNativeField = (
  {
    address,
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
  const colorForAsset = useColorForAsset({ address });
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(nativeAmount);
  const [debouncedValue] = useDebounce(value, 300);
  const [startTimeout, stopTimeout] = useTimeout();
  const [editing, setEditing] = useState(false);

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
      onFocus?.(event);
    },
    [onFocus]
  );
  const { colors } = useTheme();

  useEffect(() => {
    setNativeAmount(debouncedValue);
  }, [debouncedValue, setNativeAmount]);

  const nativeAmountColor = useMemo(() => {
    const nativeAmountExists =
      typeof nativeAmount === 'string' && nativeAmount.length > 0;

    const color = isFocused ? colors.dark : colors.blueGreyDark;
    const opacity = isFocused ? 1 : nativeAmountExists ? 0.5 : 0.3;

    return colors.alpha(color, opacity);
  }, [colors, isFocused, nativeAmount]);

  useEffect(() => {
    setEditing(true);
    startTimeout(() => setEditing(false), 1000);
    return () => stopTimeout();
  }, [value, startTimeout, stopTimeout]);

  return (
    <TouchableWithoutFeedback onPress={handleFocusNativeField}>
      <Row align="center" flex={1} height={height}>
        <CurrencySymbol color={nativeAmountColor} height={height}>
          {symbol}
        </CurrencySymbol>
        <NativeInput
          color={nativeAmountColor}
          editable={editable}
          height={android ? height : 58}
          mask={mask}
          onBlur={handleBlur}
          onChangeText={setValue}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          selectionColor={colorForAsset}
          testID={testID}
          value={editing ? value : nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
