import React from 'react';
import { StyleSheet } from 'react-native';

import Animated, { useAnimatedStyle, useDerivedValue, withTiming, type DerivedValue, type SharedValue } from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { AnimatedText, Box, Inline, Text, TextIcon, useForegroundColor, type Space } from '@/design-system';
import { VisaBadge } from '@/features/cash/components/VisaBadge';
import { ADD_CASH_MIN_AMOUNT_USD } from '@/features/cash/screens/add-cash-sheet/addCashAmountModel';
import { useAddCashFee } from '@/features/cash/stores/addCashFeeStore';
import type { CashFundingState } from '@/features/cash/stores/cashPaymentMethodStore';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { mulWorklet } from '@/framework/core/safeMath';
import * as i18n from '@/languages';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

const slowerFadeConfig = TIMING_CONFIGS.slowerFadeConfig;

export function AddFromRow({
  amount,
  funding,
  onPress,
  paddingHorizontal = '28px',
}: {
  amount: SharedValue<string> | DerivedValue<string>;
  funding: Exclude<CashFundingState, { kind: 'none' }>;
  onPress: () => void;
  paddingHorizontal?: Space;
}) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <Box paddingTop="12px">
      <Box style={[styles.separator, { backgroundColor: separatorTertiary }]} />
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal={paddingHorizontal} paddingTop="20px">
        <ButtonPressAnimation
          disabled={funding.kind === 'loading'}
          onPress={onPress}
          scaleTo={0.96}
          testID={funding.kind === 'card' ? 'cash-deposit-add-cash-add-from' : undefined}
        >
          {funding.kind === 'loading' ? (
            <AnimatedSpinner color={labelTertiary} containerStyle={styles.spinner} isLoading size={18} />
          ) : (
            <Inline alignVertical="center" space="8px">
              <VisaBadge />

              <Inline alignVertical="center" space="2px">
                <Text color="label" size="15pt" weight="bold">
                  Visa
                </Text>
                <Text align="right" color="labelQuaternary" size="15pt" weight="semibold">
                  {`*${funding.card.last4}`}
                </Text>

                <TextIcon color="labelQuaternary" size="13pt" textStyle={{ marginLeft: 4 }} weight="semibold" width={14}>
                  {'􀆏'}
                </TextIcon>
              </Inline>
            </Inline>
          )}
        </ButtonPressAnimation>

        <EstimatedReceivedAmount amount={amount} />
      </Box>
    </Box>
  );
}

function formatReceivedAmount(amount: number | string, addCashRate: string): string | null {
  'worklet';
  if (Number(amount) < ADD_CASH_MIN_AMOUNT_USD) return null;
  return `~${formatUsd(mulWorklet(amount, addCashRate))}`;
}

function EstimatedReceivedAmount({ amount }: { amount: number | SharedValue<string> }) {
  const addCashRate = useStoreSharedValue(useAddCashFee, s => s);
  const receivedAmount = useDerivedValue(() => {
    return formatReceivedAmount(typeof amount === 'number' ? amount : amount.value, addCashRate.value);
  });

  const receive = i18n.t(i18n.l.cash.add_cash_screen.receive);
  const minimum = i18n.t(i18n.l.cash.add_cash_screen.minimum);
  const receiveLabel = useDerivedValue(() => (receivedAmount.value ? receive : `${minimum} $${ADD_CASH_MIN_AMOUNT_USD}`));

  const containerStyle = useAnimatedStyle(() => {
    const hasAmount = !!receivedAmount.value;
    return {
      columnGap: hasAmount ? 4 : 0,
      opacity: withTiming(hasAmount ? 1 : 0.7, slowerFadeConfig),
    };
  });

  return (
    <Animated.View style={[styles.receiveRow, containerStyle]}>
      <AnimatedText align="right" color="labelQuaternary" size="15pt" weight="semibold">
        {receiveLabel}
      </AnimatedText>
      <AnimatedText align="right" color="labelTertiary" size="15pt" weight="bold">
        {receivedAmount}
      </AnimatedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  receiveRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  separator: {
    borderRadius: 1,
    height: 1,
    marginHorizontal: 28,
  },
  spinner: {
    height: 22,
  },
});
