import React from 'react';
import { StyleSheet } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Inline, Text, useForegroundColor } from '@/design-system';
import { type LinkedCard } from '@/features/cash/services/authSession';
import * as i18n from '@/languages';

function VisaBadge() {
  return (
    <Box
      alignItems="center"
      borderRadius={6}
      height={{ custom: 20 }}
      justifyContent="center"
      style={styles.visaBadge}
      width={{ custom: 28 }}
    >
      <Text align="center" color="white" size="icon 8px" weight="heavy">
        {'VISA'}
      </Text>
    </Box>
  );
}

export function AddFromRow({ card, onPress }: { card: LinkedCard; onPress: () => void }) {
  const separatorTertiary = useForegroundColor('separatorTertiary');

  return (
    <Box paddingTop="12px" paddingBottom="24px">
      <Box style={[styles.separator, { backgroundColor: separatorTertiary }]} />
      <ButtonPressAnimation onPress={onPress} scaleTo={0.96} testID="cash-deposit-add-cash-add-from">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="28px" paddingTop="20px">
          <Text color="labelQuaternary" size="17pt" weight="bold">
            {i18n.t(i18n.l.cash.add_cash_screen.add_from)}
          </Text>
          <Inline alignVertical="center" space="8px">
            <VisaBadge />
            <Text color="label" size="17pt" weight="bold">
              {card.brand}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {`*${card.last4}`}
            </Text>
            <Text color="labelSecondary" size="13pt" weight="heavy">
              {'􀆊'}
            </Text>
          </Inline>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

const styles = StyleSheet.create({
  separator: {
    borderRadius: 1,
    height: 1,
    marginHorizontal: 28,
  },
  visaBadge: {
    backgroundColor: '#1B33C3',
  },
});
