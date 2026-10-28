import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { greaterThanOrEqualToWorklet, lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { convertAmountToBalanceDisplay, handleSignificantDecimals } from '@/helpers/utilities';

export type PnlDirection = 'profit' | 'loss' | 'flat';

const COMPACT_AMOUNT_FROM = 10_000;

/** Uppercases the `k`/`m`/`b` suffix of an abbreviated number, e.g. `$146.9k` → `$146.9K`. */
function uppercaseSuffix(display: string) {
  return display.replace(/(\d)([kmb])/, (_, digit: string, suffix: string) => digit + suffix.toUpperCase());
}

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

/**
 * Rounds to the currency's minor unit, e.g. `$0.02`, and keeps significant decimals only below it, e.g. `$0.00283`.
 * `compact` abbreviates from ten thousand up, e.g. `$146.9K`.
 */
export function formatNativeAmount(amount: string, nativeCurrency: NativeCurrencyKey, { compact = false }: { compact?: boolean } = {}) {
  const magnitude = amount.replace('-', '');
  const { decimals } = supportedCurrencies[nativeCurrency];
  const minorUnit = decimals === 0 ? '1' : `0.${'1'.padStart(decimals, '0')}`;
  const rounded = greaterThanOrEqualToWorklet(magnitude, minorUnit) ? toFixedWorklet(amount, decimals) : amount;
  const abbreviate = compact && greaterThanOrEqualToWorklet(magnitude, COMPACT_AMOUNT_FROM);
  const display = convertAmountToNativeDisplay(rounded, nativeCurrency, undefined, undefined, abbreviate);
  return abbreviate ? uppercaseSuffix(display) : display;
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
