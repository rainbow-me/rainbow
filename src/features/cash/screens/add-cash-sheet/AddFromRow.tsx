import React from 'react';
import { StyleSheet } from 'react-native';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Inline, Text, useForegroundColor } from '@/design-system';
import { VisaBadge } from '@/features/cash/components/VisaBadge';
import type { CashFundingState } from '@/features/cash/stores/cashPaymentMethodStore';
import * as i18n from '@/languages';

export function AddFromRow({ funding, onPress }: { funding: Exclude<CashFundingState, { kind: 'none' }>; onPress: () => void }) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <Box paddingTop="12px">
      <Box style={[styles.separator, { backgroundColor: separatorTertiary }]} />
      <ButtonPressAnimation
        disabled={funding.kind === 'loading'}
        onPress={onPress}
        scaleTo={0.96}
        testID={funding.kind === 'card' ? 'cash-deposit-add-cash-add-from' : undefined}
      >
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="28px" paddingTop="20px">
          <Text color="labelQuaternary" size="17pt" weight="bold">
            {i18n.t(i18n.l.cash.add_cash_screen.add_from)}
          </Text>
          {funding.kind === 'loading' ? (
            <AnimatedSpinner color={labelTertiary} containerStyle={styles.spinner} isLoading size={18} />
          ) : (
            <Inline alignVertical="center" space="8px">
              <VisaBadge />
              <Text color="label" size="17pt" weight="bold">
                {funding.card.brand}
              </Text>
              <Text color="labelTertiary" size="17pt" weight="semibold">
                {`*${funding.card.last4}`}
              </Text>
              <Text color="labelSecondary" size="13pt" weight="heavy">
                {'􀆊'}
              </Text>
            </Inline>
          )}
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
  // The VisaBadge height, so the row keeps its size when the loaded card replaces the spinner.
  spinner: {
    height: 20,
  },
});
