import React, {
  ForwardRefRenderFunction,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TextInput, TouchableWithoutFeedback } from 'react-native';
import { Row } from '../layout';
import { Text } from '../text';
import ExchangeInput from './ExchangeInput';
import { useColorForAsset } from '@/hooks';
import { supportedNativeCurrencies } from '@/references';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';

interface CurrencySymbolProps {
  height: number;
  color: string;
}

const CurrencySymbol = styled(Text).attrs(
  ({ height, color }: CurrencySymbolProps) => ({
    color: color,
    letterSpacing: 'roundedTight',
    lineHeight: height,
    size: 'larger',
    weight: 'regular',
  })
)(android ? { marginBottom: 1.5 } : {});

const NativeInput = styled(ExchangeInput).attrs({
  letterSpacing: fonts.letterSpacing.roundedTight,
  size: fonts.size.larger,
  weight: fonts.weight.regular,
})({
  height: ({ height }: { height: number }) => height,
});

interface ExchangeNativeFieldProps {
  address: string;
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

type SupportedNativeCurrencies = keyof typeof supportedNativeCurrencies;

const ExchangeNativeField: ForwardRefRenderFunction<
  TextInput,
  ExchangeNativeFieldProps
> = (
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
    mainnetAddress,
    type,
    testID,
  },
  ref
) => {
  const nativeFieldRef = ref as MutableRefObject<TextInput>;
  const colorForAsset = useColorForAsset({
    address,
    mainnet_address: mainnetAddress,
    type,
  });
  const [value, setValue] = useState(nativeAmount);

  const { mask, placeholder, symbol } = supportedNativeCurrencies[
    nativeCurrency as SupportedNativeCurrencies
  ];

  const handleFocusNativeField = useCallback(
    () => nativeFieldRef?.current?.focus(),
    [nativeFieldRef]
  );

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

  const isFocused = nativeFieldRef?.current?.isFocused();

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
          ref={nativeFieldRef}
          selectionColor={colorForAsset}
          testID={testID}
          value={isFocused ? value : nativeAmount}
        />
      </Row>
    </TouchableWithoutFeedback>
  );
};

export default React.forwardRef(ExchangeNativeField);
