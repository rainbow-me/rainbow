import { memoFn } from '../utils/memoFn';
import { supportedNativeCurrencies } from '@/references';
import { NativeCurrencyKey } from '@/entities';
import { convertAmountToNativeDisplayWorklet } from './utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getNumberFormatter } from '@/helpers/intl';

/**
 * @desc subtracts two numbers
 * @param  {String}   str
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const containsEmoji = memoFn(str => {
  const ranges = ['(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])'];
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  return !!str.match(ranges.join('|'));
});

/*
 * Return the given number as a formatted string.  The default format is a plain
 * integer with thousands-separator commas.  The optional parameters facilitate
 * other formats:
 *   - decimals = the number of decimals places to round to and show
 *   - valueIfNaN = the value to show for non-numeric input
 *   - style
 *     - '%': multiplies by 100 and appends a percent symbol
 *     - '$': prepends a dollar sign
 *   - useOrderSuffix = whether to use suffixes like k for 1,000, etc.
 *   - orderSuffixes = the list of suffixes to use
 *   - minOrder and maxOrder allow the order to be constrained.  Examples:
 *     - minOrder = 1 means the k suffix should be used for numbers < 1,000
 *     - maxOrder = 1 means the k suffix should be used for numbers >= 1,000,000
 */
export function formatNumber(
  number: string | number,
  {
    decimals = 0,
    valueIfNaN = '',
    style = '',
    useOrderSuffix = false,
    orderSuffixes = ['', 'K', 'M', 'B', 'T'],
    minOrder = 0,
    maxOrder = Infinity,
  } = {}
) {
  let x = parseFloat(`${number}`);

  if (isNaN(x)) return valueIfNaN;

  if (style === '%') x *= 100.0;

  let order;
  if (!isFinite(x) || !useOrderSuffix) order = 0;
  else if (minOrder === maxOrder) order = minOrder;
  else {
    const unboundedOrder = Math.floor(Math.log10(Math.abs(x)) / 3);
    order = Math.max(0, minOrder, Math.min(unboundedOrder, maxOrder, orderSuffixes.length - 1));
  }

  const orderSuffix = orderSuffixes[order];
  if (order !== 0) x /= Math.pow(10, order * 3);

  return (
    (style === '$' ? '$' : '') +
    getNumberFormatter('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
      style: 'decimal',
    }).format(x) +
    orderSuffix +
    (style === '%' ? '%' : '')
  );
}

const subscriptDigits: { [key: string]: string } = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

const superscriptDigits: { [key: string]: string } = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

export function toSubscript(digit: string) {
  'worklet';
  if (digit.length !== 1) {
    throw new Error('toSubscript expects a single character digit [0-9]');
  }
  return subscriptDigits[digit] || digit;
}

export function toSuperscript(digit: string) {
  'worklet';
  if (digit.length !== 1) {
    throw new Error('toSuperscript expects a single character digit [0-9]');
  }
  return superscriptDigits[digit] || digit;
}

/*
  converts 6.9e-7 to 0.00000069
*/
function toDecimalString(num: number): string {
  return num.toFixed(20).replace(/\.?0+$/, '');
}

export function formatFractionWorklet(fraction: string, significantDigitsCount = 2): string {
  'worklet';
  let leadingZeros = 0;
  for (let i = 0; i < fraction.length; i++) {
    if (fraction[i] === '0') {
      leadingZeros += 1;
    } else {
      break;
    }
  }
  const significantPart = fraction.slice(leadingZeros);
  if (significantPart.length === 0 || /^[0]+$/.test(significantPart)) {
    return '0'.repeat(significantDigitsCount);
  }
  const significantDigits = significantPart.slice(0, significantDigitsCount).padEnd(significantDigitsCount, '0');
  if (leadingZeros >= 4) {
    const leadingZerosStr = leadingZeros.toString();
    let subscriptZeros = '';
    for (let i = 0; i < leadingZerosStr.length; i++) {
      subscriptZeros += toSubscript(String(leadingZerosStr[i]));
    }
    return `0${subscriptZeros}${significantDigits}`;
  }
  return `${'0'.repeat(leadingZeros)}${significantDigits}`;
}

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
