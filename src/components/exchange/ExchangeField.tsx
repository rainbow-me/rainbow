import React, { FocusEvent, ForwardRefRenderFunction, MutableRefObject, useCallback, useEffect, useState } from 'react';
import { StyleProp, TextInput, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import { TokenSelectionButton } from '../buttons';
import { ChainBadge, CoinIconSize } from '../coin-icon';
import { EnDash } from '../text';
import ExchangeInput from './ExchangeInput';
import { Network } from '@/helpers';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import { AccentColorProvider, Box, Space } from '@/design-system';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';
import { TokenColors } from '@/graphql/__generated__/metadata';

const ExchangeFieldHeight = android ? 64 : 38;
const ExchangeFieldPadding: Space = android ? '15px (Deprecated)' : '19px (Deprecated)';

const Input = styled(ExchangeInput).attrs({
  letterSpacing: 'roundedTightest',
})({
  height: ExchangeFieldHeight + (android ? 20 : 0),
  marginVertical: -10,
});

interface ExchangeFieldProps {
  icon?: string;
  colors?: TokenColors;
  address: string;
  color: string;
  mainnetAddress?: string;
  amount: string | null;
  disableCurrencySelection?: boolean;
  editable: boolean;
  loading: boolean;
  type?: string;
  network: Network;
  onBlur?: (event: FocusEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onPressSelectCurrency: (chainId: any) => void;
  onTapWhileDisabled?: () => void;
  setAmount: (value: string | null) => void;
  symbol?: string;
  testID: string;
  useCustomAndroidMask: boolean;
  updateOnFocus: boolean;
  style?: StyleProp<ViewStyle>;
}

const ExchangeField: ForwardRefRenderFunction<TextInput, ExchangeFieldProps> = (
  {
    icon,
    colors,
    amount,
    color,
    disableCurrencySelection,
    editable,
    loading,
    network,
    onBlur,
    onFocus,
    onPressSelectCurrency,
    onTapWhileDisabled,
    setAmount,
    symbol,
    testID,
    useCustomAndroidMask = false,
    updateOnFocus = false,
    style,
  },
  ref
) => {
  const inputRef = ref as MutableRefObject<TextInput>;
  const theme = useTheme();
  const [value, setValue] = useState(amount);

  const handleFocusField = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  const handleBlur = useCallback(
    // @ts-expect-error passed to an untyped JS component
    event => {
      onBlur?.(event);
    },
    [onBlur]
  );
  const handleFocus = useCallback(
    // @ts-expect-error passed to an untyped JS component
    event => {
      onFocus?.(event);
      if (loading) {
        setAmount(value);
      }
    },
    [loading, onFocus, setAmount, value]
  );

  const onChangeText = useCallback(
    // @ts-expect-error passed to an untyped JS component
    text => {
      setAmount(text);
      setValue(text);
    },
    [setAmount]
  );

  const placeholderTextColor = symbol
    ? theme.colors.alpha(theme.colors.blueGreyDark, 0.3)
    : theme.colors.alpha(theme.colors.blueGreyDark, 0.1);

  const placeholderText = symbol ? '0' : EnDash.unicode;

  const editing = inputRef?.current?.isFocused?.() ?? false;

  useEffect(() => {
    if (!editing || updateOnFocus) {
      setValue(amount);
    }
  }, [amount, editing, updateOnFocus]);

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-end"
      paddingRight={ExchangeFieldPadding}
      width="full"
      style={style}
      testID={`${testID}-${symbol || 'empty'}-${network || 'empty'}`}
    >
      <TouchableWithoutFeedback onPress={onTapWhileDisabled ?? handleFocusField}>
        <Box
          flexDirection="row"
          flexGrow={1}
          flexBasis={0}
          flexShrink={0}
          alignItems="center"
          width="full"
          paddingLeft={ExchangeFieldPadding}
          paddingRight={disableCurrencySelection ? ExchangeFieldPadding : '6px'}
        >
          <Box paddingRight="10px">
            {symbol ? (
              <RainbowCoinIcon size={40} icon={icon} network={network} symbol={symbol} theme={theme} colors={colors} />
            ) : (
              <Box>
                <AccentColorProvider color={theme.colors.alpha(theme.colors.blueGreyDark, 0.1)}>
                  <Box background="accent" style={{ ...borders.buildCircleAsObject(CoinIconSize) }} />
                </AccentColorProvider>
                <ChainBadge network={network} />
              </Box>
            )}
          </Box>

          <Input
            {...(android &&
              color && {
                selectionColor: theme.colors.alpha(color, 0.4),
              })}
            color={color}
            editable={editable}
            onBlur={handleBlur}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            placeholder={placeholderText}
            placeholderTextColor={placeholderTextColor}
            {...(onTapWhileDisabled && { pointerEvents: 'none' })}
            ref={ref}
            testID={testID}
            useCustomAndroidMask={useCustomAndroidMask}
            value={editing ? value : amount}
          />
        </Box>
      </TouchableWithoutFeedback>
      {!disableCurrencySelection && (
        <TokenSelectionButton color={color} onPress={onPressSelectCurrency} symbol={symbol} testID={testID + '-selection-button'} />
      )}
    </Box>
  );
};

export default React.forwardRef(ExchangeField);
