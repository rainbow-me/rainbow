import { formatFractionWorklet, formatNumber, toDecimalString } from '@/helpers/strings';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { supportedCurrencies as supportedNativeCurrencies } from '../supportedCurrencies';
import { type NativeCurrencyKey } from '../types';
import { convertAmountToNativeDisplayWorklet } from './nativeDisplay';

type CurrencyFormatterOptions = {
  decimals?: number;
  valueIfNaN?: string;
  currency?: NativeCurrencyKey;
};

export function formatCurrency(
  value: string | number,
  { valueIfNaN = '', currency = userAssetsStoreManager.getState().currency }: CurrencyFormatterOptions = {}
): string {
  const numericString = typeof value === 'number' ? toDecimalString(value) : String(value);
  if (isNaN(+numericString)) return valueIfNaN;

  const currencySymbol = supportedNativeCurrencies[currency].symbol;
  const [whole, fraction = ''] = numericString.split('.');

  const numericalWholeNumber = +whole;
  if (numericalWholeNumber > 0) {
    // if the fraction is empty and the numeric string is less than 6 characters, we can just run it through our native currency display worklet
    if (whole.length <= 6) {
      return convertAmountToNativeDisplayWorklet(numericString, currency, false, true);
    }

    const decimals = supportedNativeCurrencies[currency].decimals;
    // otherwise for > 6 figs native value we need to format in compact notation
    const formattedWhole = formatNumber(numericString, { decimals, useOrderSuffix: true });
    return `${currencySymbol}${formattedWhole}`;
  }

  const formattedWhole = formatNumber(whole, { decimals: 0, useOrderSuffix: true });
  const formattedFraction = formatFractionWorklet(fraction);
  // if it ends with a non-numeric character, it's in compact notation like '1.2K'
  if (isNaN(+formattedWhole[formattedWhole.length - 1])) return `${currencySymbol}${formattedWhole}`;

  return `${currencySymbol}${formattedWhole}.${formattedFraction}`;
}
