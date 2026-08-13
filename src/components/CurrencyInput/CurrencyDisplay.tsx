import React, { memo } from 'react';

import { type SharedValue } from 'react-native-reanimated';

import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { AnimatedText, Box } from '@/design-system';
import { type AnimatedTextProps } from '@/design-system/components/Text/AnimatedText';

import { CurrencyInputCaret } from './CurrencyInputCaret';

type CurrencyDisplayProps = {
  formattedValue: SharedValue<string>;
  currencySymbol?: string;
  textColorStyle: AnimatedTextProps['style'];
  isFocused: SharedValue<boolean>;
  caretColor?: string;
  disabled: boolean;
  testID?: string;
  onPress: () => void;
  textStyle: AnimatedTextProps['style'];
};

export const CurrencyDisplay = memo(function CurrencyDisplay({
  formattedValue,
  textColorStyle,
  isFocused,
  caretColor,
  disabled,
  testID,
  onPress,
  textStyle,
}: CurrencyDisplayProps) {
  return (
    <GestureHandlerButton disableHaptics disableScale onPressJS={onPress} disabled={disabled} testID={testID}>
      <Box flexDirection="row" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
        <AnimatedText size="30pt" weight="bold" numberOfLines={1} style={[textColorStyle, textStyle]}>
          {formattedValue}
        </AnimatedText>
        <CurrencyInputCaret isFocused={isFocused} color={caretColor} disabled={disabled} />
      </Box>
    </GestureHandlerButton>
  );
});
