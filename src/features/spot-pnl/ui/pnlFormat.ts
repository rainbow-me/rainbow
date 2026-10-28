import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { greaterThanOrEqualToWorklet, lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { convertAmountToBalanceDisplay, handleSignificantDecimals } from '@/helpers/utilities';

export type PnlDirection = 'profit' | 'loss' | 'flat';

export type NativeAmountStyle = 'exact' | 'compact' | 'whole';

const COMPACT_AMOUNT_FROM = 10_000;
const WHOLE_UNITS_FROM: Record<NativeAmountStyle, number | null> = { exact: null, compact: 1_000, whole: 1 };

/** Uppercases the `k`/`m`/`b` suffix of an abbreviated number, e.g. `$146.9k` → `$146.9K`. */
function uppercaseSuffix(display: string) {
  return display.replace(/(\d)([kmb])/, (_, digit: string, suffix: string) => digit + suffix.toUpperCase());
}

/** The unsigned display of a signed native amount, which reads as flat when it rounds to zero. */
export function formatPnlAmount(
  amount: string,
  nativeCurrency: NativeCurrencyKey,
  { style }: { style?: NativeAmountStyle } = {}
): { direction: PnlDirection; display: string } {
  const magnitude = amount.replace('-', '');
  const display = formatNativeAmount(magnitude, nativeCurrency, { style });
  if (display === convertAmountToNativeDisplay(0, nativeCurrency)) return { direction: 'flat', display };
  return { direction: lessThanWorklet(amount, 0) ? 'loss' : 'profit', display };
}

/**
 * - `exact` rounds to the currency's minor unit, e.g. `$7,073.81`, and keeps significant decimals only below it, e.g. `$0.00283`.
 * - `compact` drops the minor unit from a thousand up, e.g. `$7,074`, and abbreviates from ten thousand up, e.g. `$146.9K`.
 * - `whole` drops the minor unit from one up and never abbreviates, e.g. `$146,935`, so ranked values stay comparable.
 *
 * The minor unit is kept for currencies finer than cents (ETH), where whole units would hide most of the value.
 * Currencies without one (JPY) drop decimals from one up in both non-exact styles.
 */
export function formatNativeAmount(
  amount: string,
  nativeCurrency: NativeCurrencyKey,
  { style = 'exact' }: { style?: NativeAmountStyle } = {}
) {
  const { decimals } = supportedCurrencies[nativeCurrency];
  const minorUnit = decimals === 0 ? '1' : `0.${'1'.padStart(decimals, '0')}`;
  const rounded = greaterThanOrEqualToWorklet(amount.replace('-', ''), minorUnit) ? toFixedWorklet(amount, decimals) : amount;
  const roundedMagnitude = rounded.replace('-', '');

  const threshold = WHOLE_UNITS_FROM[style];
  const wholeUnitsFrom = threshold === null || decimals > 2 ? null : decimals === 0 ? 1 : threshold;
  const wholeUnits = wholeUnitsFrom !== null && greaterThanOrEqualToWorklet(roundedMagnitude, wholeUnitsFrom);
  const displayed = wholeUnits ? toFixedWorklet(amount, 0) : rounded;

  // The rounded values only pick the tier; what is shown is rounded once from the raw amount, so 184,949.5 reads `$184.9K`.
  if (style === 'compact' && greaterThanOrEqualToWorklet(displayed.replace('-', ''), COMPACT_AMOUNT_FROM)) {
    return uppercaseSuffix(convertAmountToNativeDisplay(amount, nativeCurrency, undefined, undefined, true));
  }
  return convertAmountToNativeDisplay(displayed, nativeCurrency, undefined, wholeUnits);
}

/** A token amount with its symbol, abbreviated from ten thousand up, e.g. `86.2M HABS`. */
export function formatCompactTokenAmount(amount: string, asset: { decimals: number; symbol: string }) {
  if (lessThanWorklet(amount, COMPACT_AMOUNT_FROM)) return convertAmountToBalanceDisplay(amount, asset);
  return `${uppercaseSuffix(handleSignificantDecimals(amount, asset.decimals, undefined, false, true))} ${asset.symbol}`;
}

/**
 * Unsigned, since the direction is shown by an arrow. `compact` drops the decimals from 100% up and
 * abbreviates from a thousand, e.g. `451%`.
 */
export function formatPnlPercentage(percentage: string, { compact = false }: { compact?: boolean } = {}): string {
  const magnitude = percentage.replace('-', '');
  const display =
    compact && greaterThanOrEqualToWorklet(magnitude, 100)
      ? uppercaseSuffix(handleSignificantDecimals(magnitude, 0, 2, false, true))
      : toFixedWorklet(magnitude, 2);
  return `${display}%`;
}

export function pnlSign(direction: PnlDirection): string {
  return direction === 'flat' ? '' : direction === 'loss' ? '-' : '+';
}
