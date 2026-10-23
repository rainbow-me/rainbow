import React from 'react';

import { Text } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { greaterThanOrEqualToWorklet, lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { convertAmountToBalanceDisplay, handleSignificantDecimals } from '@/helpers/utilities';

export type PnlDirection = 'profit' | 'loss' | 'flat';

const COMPACT_AMOUNT_FROM = 10_000;

/** The unsigned display of a signed native amount, which reads as flat when it rounds to zero. */
export function formatPnlAmount(
  amount: string,
  nativeCurrency: NativeCurrencyKey,
  { compact = false }: { compact?: boolean } = {}
): { direction: PnlDirection; display: string } {
  const magnitude = amount.replace('-', '');
  const display = formatNativeAmount(magnitude, nativeCurrency, { compact });
  if (display === convertAmountToNativeDisplay(0, nativeCurrency)) return { direction: 'flat', display };
  return { direction: lessThanWorklet(amount, 0) ? 'loss' : 'profit', display };
}

/** `compact` abbreviates from ten thousand up, e.g. `$146.9k`, and keeps the cents below that. */
export function formatNativeAmount(amount: string, nativeCurrency: NativeCurrencyKey, { compact = false }: { compact?: boolean } = {}) {
  const abbreviate = compact && greaterThanOrEqualToWorklet(amount.replace('-', ''), COMPACT_AMOUNT_FROM);
  return convertAmountToNativeDisplay(amount, nativeCurrency, undefined, undefined, abbreviate);
}

/** A token amount with its symbol, abbreviated from ten thousand up, e.g. `86.2m HABS`. */
export function formatCompactTokenAmount(amount: string, asset: { decimals: number; symbol: string }) {
  if (lessThanWorklet(amount, COMPACT_AMOUNT_FROM)) return convertAmountToBalanceDisplay(amount, asset);
  return `${handleSignificantDecimals(amount, asset.decimals, undefined, false, true)} ${asset.symbol}`;
}

/**
 * Unsigned, since the direction is shown by an arrow. `compact` drops the decimals from 100% up and
 * abbreviates from a thousand, e.g. `451%`.
 */
export function formatPnlPercentage(percentage: string, { compact = false }: { compact?: boolean } = {}): string {
  const magnitude = percentage.replace('-', '');
  const display =
    compact && greaterThanOrEqualToWorklet(magnitude, 100)
      ? handleSignificantDecimals(magnitude, 0, 2, false, true)
      : toFixedWorklet(magnitude, 2);
  return `${display}%`;
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
    <Text color={color} size={size} weight={weight}>
      {direction === 'loss' ? '􀄩' : '􀄨'}
    </Text>
  );
}
