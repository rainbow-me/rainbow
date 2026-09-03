import React from 'react';
import { type GestureResponderEvent } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, type BoxProps } from '@/design-system';
import { CASH_BALANCE_COLORS } from '@/features/cash-balance/constants';

// The green gradient CTA shared by the wallet row's Add button and the half sheet's Add/Withdraw/Send buttons.
export function CashBalanceGradientButton({
  children,
  height,
  onPress,
  paddingHorizontal,
  scaleTo = 0.94,
  testID,
  width,
}: {
  children: React.ReactNode;
  height: number;
  onPress: (event?: GestureResponderEvent) => void;
  paddingHorizontal?: BoxProps['paddingHorizontal'];
  scaleTo?: number;
  testID: string;
  width?: BoxProps['width'];
}) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={scaleTo} testID={testID}>
      <Box
        as={LinearGradient}
        alignItems="center"
        background="green"
        borderRadius={height / 2}
        colors={CASH_BALANCE_COLORS.addButtonGradient}
        end={{ x: 0.75, y: 1 }}
        height={{ custom: height }}
        justifyContent="center"
        paddingHorizontal={paddingHorizontal}
        shadow="12px green"
        start={{ x: 0, y: 0 }}
        width={width}
      >
        {children}
      </Box>
    </ButtonPressAnimation>
  );
}
