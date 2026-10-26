import React from 'react';

import { Text } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';

export type PnlDirection = 'profit' | 'loss' | 'flat';

/** The unsigned display of a signed native amount, which reads as flat when it rounds to zero. */
export function formatPnlAmount(amount: string, nativeCurrency: NativeCurrencyKey): { direction: PnlDirection; display: string } {
  const display = convertAmountToNativeDisplay(amount.replace('-', ''), nativeCurrency);
  if (display === convertAmountToNativeDisplay(0, nativeCurrency)) return { direction: 'flat', display };
  return { direction: lessThanWorklet(amount, 0) ? 'loss' : 'profit', display };
}

/** Unsigned, since the direction is shown by an arrow. */
export function formatPnlPercentage(percentage: string): string {
  return `${toFixedWorklet(percentage.replace('-', ''), 2)}%`;
}

export function pnlSign(direction: PnlDirection): string {
  return direction === 'flat' ? '' : direction === 'loss' ? '-' : '+';
}

export function pnlColor(direction: PnlDirection, colors: { green: string; red: string }): TextProps['color'] {
  return direction === 'flat' ? 'labelSecondary' : { custom: direction === 'loss' ? colors.red : colors.green };
}

export function PnlArrow({ color, direction, size, weight }: Pick<TextProps, 'color' | 'size' | 'weight'> & { direction: PnlDirection }) {
  if (direction === 'flat') return null;
  return (
    <Text color={color} size={size} weight={weight} style={direction === 'loss' ? { transform: [{ rotate: '180deg' }] } : undefined}>
      {'↑'}
    </Text>
  );
}
