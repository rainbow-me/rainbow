import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { divWorklet, equalWorklet, greaterThanOrEqualToWorklet, lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';
import { convertAmountToBalanceDisplay, handleSignificantDecimals } from '@/helpers/utilities';

export type PnlDirection = 'profit' | 'loss' | 'flat';

const COMPACT_AMOUNT_FROM = 100_000;
const COMPACT_PERCENTAGE_FROM = 1_000;
const COMPACT_TOKEN_AMOUNT_FROM = 10_000;
const SUFFIXES = [
  { suffix: 'K', value: 1e3 },
  { suffix: 'M', value: 1e6 },
  { suffix: 'B', value: 1e9 },
  { suffix: 'T', value: 1e12 },
];

/** Uppercases the `k`/`m`/`b` suffix of an abbreviated number, e.g. `86.2m HABS` → `86.2M HABS`. */
function uppercaseSuffix(display: string) {
  return display.replace(/(\d)([kmb])/, (_, digit: string, suffix: string) => digit + suffix.toUpperCase());
}

/**
 * One decimal, trailing zero kept, on the first suffix where the rounded value stays below a thousand,
 * e.g. `184.0K`, and 999,950 → `1.0M`. Rounded once from the raw value, so 999,949.5 → `999.9K`.
 */
function abbreviate(magnitude: string): string {
  let tier = 0;
  let scaled = toFixedWorklet(divWorklet(magnitude, SUFFIXES[tier].value), 1);
  while (tier < SUFFIXES.length - 1 && greaterThanOrEqualToWorklet(scaled, 1000)) {
    tier += 1;
    scaled = toFixedWorklet(divWorklet(magnitude, SUFFIXES[tier].value), 1);
  }
  return `${addCommasToNumber(scaled)}${SUFFIXES[tier].suffix}`;
}

/** The unsigned display of a signed native amount, which reads as flat when it displays as zero. */
export function formatPnlAmount(amount: string, nativeCurrency: NativeCurrencyKey): { direction: PnlDirection; display: string } {
  const display = formatNativeAmount(amount, nativeCurrency);
  if (display === convertAmountToNativeDisplay(0, nativeCurrency)) return { direction: 'flat', display };
  return { direction: lessThanWorklet(amount, 0) ? 'loss' : 'profit', display };
}

/**
 * Unsigned. Below the currency's minor unit keeps significant decimals, e.g. `$0.00283`. From there: cents below one,
 * e.g. `$0.43`, whole units below 100K, e.g. `$7,074`, then one decimal on a suffix, e.g. `$184.0K`.
 * Each tier is picked on the value rounded for the tier below, so `$0.996` → `$1` and `$99,999.60` → `$100.0K`.
 * Currencies finer than cents (ETH) keep their decimals below 100K, where whole units would hide most of the value.
 */
export function formatNativeAmount(amount: string, nativeCurrency: NativeCurrencyKey): string {
  const magnitude = amount.replace('-', '');
  const { alignment, decimals, symbol } = supportedCurrencies[nativeCurrency];
  const minorUnit = decimals === 0 ? '1' : `0.${'1'.padStart(decimals, '0')}`;
  if (lessThanWorklet(magnitude, minorUnit)) return convertAmountToNativeDisplay(magnitude, nativeCurrency);

  if (greaterThanOrEqualToWorklet(toFixedWorklet(magnitude, 0), COMPACT_AMOUNT_FROM)) {
    const display = abbreviate(magnitude);
    return alignment === 'left' ? `${symbol}${display}` : `${display} ${symbol}`;
  }

  const rounded = toFixedWorklet(magnitude, decimals);
  if (decimals > 2 || lessThanWorklet(rounded, 1)) return convertAmountToNativeDisplay(rounded, nativeCurrency);
  return convertAmountToNativeDisplay(toFixedWorklet(magnitude, 0), nativeCurrency, undefined, true);
}

/** A token amount with its symbol, abbreviated from ten thousand up, e.g. `86.2M HABS`. */
export function formatCompactTokenAmount(amount: string, asset: { decimals: number; symbol: string }) {
  if (lessThanWorklet(amount, COMPACT_TOKEN_AMOUNT_FROM)) return convertAmountToBalanceDisplay(amount, asset);
  return `${uppercaseSuffix(handleSignificantDecimals(amount, asset.decimals, undefined, false, true))} ${asset.symbol}`;
}

/**
 * Unsigned, since the direction is shown by an arrow. `<1%` between zero and one, whole percents below a thousand,
 * then one decimal on a suffix, e.g. `3.9K%`.
 */
export function formatPnlPercentage(percentage: string): string {
  const magnitude = percentage.replace('-', '');
  if (equalWorklet(magnitude, 0)) return '0%';
  if (lessThanWorklet(magnitude, 1)) return '<1%';
  const whole = toFixedWorklet(magnitude, 0);
  return `${lessThanWorklet(whole, COMPACT_PERCENTAGE_FROM) ? whole : abbreviate(magnitude)}%`;
}

export function pnlSign(direction: PnlDirection): string {
  return direction === 'flat' ? '' : direction === 'loss' ? '-' : '+';
}
