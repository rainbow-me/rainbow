import React, { ForwardRefRenderFunction, MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput, TouchableWithoutFeedback } from 'react-native';
import { Row } from '../layout';
import ExchangeInput from './ExchangeInput';
import { supportedNativeCurrencies } from '@/references';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';
import { Box, Text } from '@/design-system';
import { NativeCurrencyKey } from '@/entities';

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.larger,
  weight: fonts.weight.regular,
})({
  height: ({ height }: { height: number }) => height,
});

interface ExchangeNativeFieldProps {
  color: string;
  editable: boolean;
  height: number;
  loading: boolean;
  nativeAmount: string | null;
  nativeCurrency: string;
  onFocus: ({ target }: { target: Element }) => void;
  setNativeAmount: (value: string | null) => void;
  updateOnFocus: boolean;
  testID: string;
}

const ExchangeNativeField: ForwardRefRenderFunction<TextInput, ExchangeNativeFieldProps> = (
  { color, editable, height, loading, nativeAmount, nativeCurrency, onFocus, setNativeAmount, updateOnFocus, testID },
  ref
) => {
  const nativeFieldRef = ref as MutableRefObject<TextInput>;

  const [value, setValue] = useState(nativeAmount);

  const { mask, placeholder, symbol } = supportedNativeCurrencies[nativeCurrency as NativeCurrencyKey];

  const handleFocusNativeField = useCallback(() => nativeFieldRef?.current?.focus(), [nativeFieldRef]);

  const handleFocus = useCallback(
    // @ts-expect-error passed to an untyped JS component
    event => {
      onFocus?.(event);
      if (loading) {
        setNativeAmount(value);
      }
    },
    [loading, onFocus, setNativeAmount, value]
  );

  const onChangeText = useCallback(
    // @ts-expect-error passed to an untyped JS component
    text => {
      setNativeAmount(text);
      setValue(text);
    },
    [setNativeAmount]
  );

  const { colors } = useTheme();

  const isFocused = nativeFieldRef?.current?.isFocused?.();

  const nativeAmountColor = useMemo(() => {
    const nativeAmountExists = typeof nativeAmount === 'string' && nativeAmount.length > 0;

    const color = isFocused ? colors.dark : colors.blueGreyDark;
    const opacity = isFocused ? 1 : nativeAmountExists ? 0.5 : 0.3;

    return colors.alpha(color, opacity);
  }, [colors, isFocused, nativeAmount]);

  useEffect(() => {
    if (!isFocused || updateOnFocus) {
      setValue(nativeAmount);
    }
  }, [nativeAmount, isFocused, updateOnFocus]);

  return (
    <TouchableWithoutFeedback onPress={handleFocusNativeField}>
      <Row align="center" flex={1} height={height} paddingTop={android ? 6 : undefined}>
        <Box paddingBottom={android ? '2px' : undefined}>
          <Text color={{ custom: nativeAmountColor }} size="20pt">
            {symbol}
          </Text>
        </Box>
        <NativeInput
          color={nativeAmountColor}
          editable={editable}
          height={android ? height : 58}
          mask={mask}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={nativeFieldRef}
          selectionColor={color}
          testID={testID}
          value={isFocused ? value : nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
