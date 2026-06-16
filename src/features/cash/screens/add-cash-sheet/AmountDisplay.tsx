import React from 'react';
import { StyleSheet } from 'react-native';

import { type SharedValue } from 'react-native-reanimated';

import { InputValueCaret } from '@/components/number-pad/InputValueCaret';
import { AnimatedText, Box, useForegroundColor } from '@/design-system';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';

// Mirror the Deposit/Withdrawal amount formatting: "$" + comma-grouped value, "$0" when empty.
const selectFormattedAmount = (value: SharedValue<string>) => {
  'worklet';
  const amount = value.value;
  if (!amount || amount === '0') return '$0';
  return `$${addCommasToNumber(amount, '0')}`;
};

export function AmountDisplay({ displayedAmount }: { displayedAmount: SharedValue<string> }) {
  const accent = useForegroundColor('accent');

  return (
    <Box
      alignItems="center"
      flexDirection="row"
      justifyContent="center"
      paddingHorizontal="20px"
      testID="cash-deposit-add-cash-amount-display-container"
      width="full"
    >
      <AnimatedText
        align="center"
        color="label"
        ellipsizeMode="middle"
        numberOfLines={1}
        selector={selectFormattedAmount}
        size="64pt"
        style={styles.glyph}
        tabularNumbers
        testID="cash-deposit-add-cash-amount-display"
        weight="heavy"
      >
        {displayedAmount}
      </AnimatedText>
      <Box style={styles.caret}>
        <InputValueCaret color={accent} height={57} value={displayedAmount} />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  caret: {
    marginLeft: 4,
  },
  glyph: {
    flexShrink: 1,
  },
});
