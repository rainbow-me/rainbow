import React, { memo } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { CurrencyInputCaret } from './CurrencyInputCaret';

type CurrencyDisplayProps = {
  formattedValue: SharedValue<string>;
  currencySymbol?: string;
  textColorStyle: StyleProp<TextStyle>;
  isFocused: SharedValue<boolean>;
  value: SharedValue<string>;
  caretColor?: string;
  disabled: boolean;
  testID?: string;
  onPress: () => void;
  textStyle: StyleProp<TextStyle>;
};

export const CurrencyDisplay = memo(function CurrencyDisplay({
  formattedValue,
  textColorStyle,
  isFocused,
  value,
  caretColor,
  disabled,
  testID,
  onPress,
  textStyle,
}: CurrencyDisplayProps) {
  const hasValue = useDerivedValue(() => value.value !== '');

  return (
    <GestureHandlerButton disableHaptics disableScale onPressJS={onPress} disabled={disabled} testID={testID}>
      <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
        <AnimatedText size="30pt" weight="bold" numberOfLines={1} style={[textColorStyle, textStyle]}>
          {formattedValue}
        </AnimatedText>
        <CurrencyInputCaret isFocused={isFocused} hasValue={hasValue} color={caretColor} disabled={disabled} />
      </Box>
    </GestureHandlerButton>
  );
});
