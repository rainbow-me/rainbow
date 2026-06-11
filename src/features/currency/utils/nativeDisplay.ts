import { toFixedWorklet } from '@/framework/core/safeMath';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';
import { getNumberFormatter } from '@/helpers/intl';
import {
  convertAmountToNativeAmount,
  convertRawAmountToDecimalFormat,
  handleSignificantDecimals,
  type BigNumberish,
} from '@/helpers/utilities';

import { supportedCurrencies as supportedNativeCurrencies } from '../supportedCurrencies';
import { type NativeCurrencyKey } from '../types';

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountAndPriceToNativeDisplay = (
  amount: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: NativeCurrencyKey,
  useThreshold = false
): { amount: string; display: string } => {
  const nativeBalanceRaw = convertAmountToNativeAmount(amount, priceUnit);
  const nativeDisplay = convertAmountToNativeDisplayWorklet(nativeBalanceRaw, nativeCurrency, useThreshold);
  return {
    amount: nativeBalanceRaw,
    display: nativeDisplay,
  };
};

/**
 * @desc convert from raw amount to display formatted string
 */
export const convertRawAmountToNativeDisplay = (
  rawAmount: BigNumberish,
  assetDecimals: number,
  priceUnit: BigNumberish,
  nativeCurrency: NativeCurrencyKey
) => {
  const assetBalance = convertRawAmountToDecimalFormat(rawAmount, assetDecimals);
  return convertAmountAndPriceToNativeDisplay(assetBalance, priceUnit, nativeCurrency);
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplayWorklet = (
  value: number | string,
  nativeCurrency: NativeCurrencyKey,
  useThreshold = false,
  ignoreAlignment = false,
  decimalPlaces?: number
) => {
  'worklet';

  const { alignment, decimals: rawDecimals, symbol } = supportedNativeCurrencies[nativeCurrency];
  const decimals = decimalPlaces ?? Math.min(rawDecimals, 6);

  const valueNumber = Number(value);
  const threshold = decimals < 4 ? 0.01 : 0.0001;
  let thresholdReached = false;

  if (useThreshold && valueNumber < threshold) {
    thresholdReached = true;
  }

  const nativeValue = thresholdReached
    ? threshold
    : getNumberFormatter('en-US', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: nativeCurrency === 'ETH' ? undefined : decimals,
        useGrouping: true,
      }).format(valueNumber);

  const nativeDisplay = `${thresholdReached ? '<' : ''}${alignment === 'left' || ignoreAlignment ? symbol : ''}${nativeValue}${!ignoreAlignment && alignment === 'right' ? symbol : ''}`;

  return nativeDisplay;
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplay = (
  value: BigNumberish,
  nativeCurrency: NativeCurrencyKey,
  buffer?: number,
  skipDecimals?: boolean,
  abbreviate?: boolean
) => {
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { decimals } = nativeSelected;
  const display = handleSignificantDecimals(value, decimals, buffer, skipDecimals, abbreviate);
  if (nativeSelected.alignment === 'left') {
    return `${nativeSelected.symbol}${display}`;
  }
  return `${display} ${nativeSelected.symbol}`;
};

export const addSymbolToNativeDisplayWorklet = (value: number | string, nativeCurrency: NativeCurrencyKey): string => {
  'worklet';

  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { symbol } = nativeSelected;

  const nativeValueWithCommas = addCommasToNumber(value, '0');

  return `${symbol}${nativeValueWithCommas}`;
};

/**
 * Trims redundant trailing zeros from a currency string's fractional part.
 * Accommodates both native currencies and ETH values.
 *
 * - Removes `.00` entirely (e.g. `2.00` → `2`).
 * - Leaves two decimals intact when needed (e.g. `2.10` → `2.10`).
 * - For values with more than two decimals, trims trailing zeros (e.g. `2.100` → `2.1`, `2.5000` → `2.5`).
 *
 * @example
 * trimCurrencyZeros('2.00')  // '2'
 * trimCurrencyZeros('2.10')  // '2.10'
 * trimCurrencyZeros('2.100') // '2.1'
 *
 * @param value - The currency value as a string.
 * @param currency - The currency to use to format the value.
 * @returns The trimmed currency string.
 */
export function trimCurrencyZeros(value: string | number, currency: NativeCurrencyKey): string {
  'worklet';
  const currencyDecimals = Math.min(supportedNativeCurrencies[currency].decimals, 6);
  const valueToTrim = toFixedWorklet(value, currencyDecimals);
  return valueToTrim.replace(/(\.(?=\d{3,})\d*?[1-9])0+$|\.0{2,}$/, '$1');
}
