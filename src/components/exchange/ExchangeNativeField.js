import React, { useCallback, useMemo, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';
import { useColorForAsset } from '@/hooks';
import { supportedNativeCurrencies } from '@/references';
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
    loading,
    nativeAmount,
    nativeCurrency,
    onFocus,
    setNativeAmount,
    updateOnFocus,
    testID,
  },
  ref
) => {
  const colorForAsset = useColorForAsset({ address });
  const [value, setValue] = useState(nativeAmount);

  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency
  ];

  const handleFocusNativeField = useCallback(() => ref?.current?.focus(), [
    ref,
  ]);

  const handleFocus = useCallback(
    event => {
      onFocus?.(event);
      if (loading) {
        setNativeAmount(value);
      }
    },
    [loading, onFocus, setNativeAmount, value]
  );

  const onChangeText = useCallback(
    text => {
      setNativeAmount(text);
      setValue(text);
    },
    [setNativeAmount]
  );

  const { colors } = useTheme();

  const isFocused = ref?.current?.isFocused();

  const nativeAmountColor = useMemo(() => {
    const nativeAmountExists =
      typeof nativeAmount === 'string' && nativeAmount.length > 0;

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
      <Row align="center" flex={1} height={height}>
        <CurrencySymbol color={nativeAmountColor} height={height}>
          {symbol}
        </CurrencySymbol>
        <NativeInput
          color={nativeAmountColor}
          editable={editable}
          height={android ? height : 58}
          mask={mask}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          ref={ref}
          selectionColor={colorForAsset}
          testID={testID}
          value={isFocused ? value : nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
