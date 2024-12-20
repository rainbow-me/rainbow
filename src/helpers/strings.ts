import store from '@/redux/store';
import { memoFn } from '../utils/memoFn';
import { supportedNativeCurrencies } from '@/references';
import { NativeCurrencyKey } from '@/entities';
import { convertAmountToNativeDisplayWorklet } from './utilities';
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
    x.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    orderSuffix +
    (style === '%' ? '%' : '')
  );
}

type CurrencyFormatterOptions = {
  decimals?: number;
  valueIfNaN?: string;
  currency?: NativeCurrencyKey;
};

const toSubscript = (str: string | number) => str.toString().replace(/[0-9]/g, num => String.fromCharCode(0x2080 + +num));

/*
  converts 6.9e-7 to 0.00000069
*/
const toDecimalString = (num: number): string => {
  const [coefficient, exponent] = num.toExponential(20).split('e');
  const exp = parseInt(exponent);
  const digits = coefficient.replace('.', '').replace(/0+$/, '');

  if (exp >= 0) {
    const position = exp + 1;
    if (position >= digits.length) return digits + '0'.repeat(position - digits.length);
    return digits.slice(0, position) + (digits.slice(position) && '.' + digits.slice(position));
  }
  return '0.' + '0'.repeat(Math.abs(exp) - 1) + digits;
};

/*
  formats a numeric string like 0000069 to 0₅69
*/
function formatFraction(fraction: string) {
  const leadingZeros = fraction.match(/^[0]+/)?.[0].length || 0;
  if (+fraction === 0) return '00';

  const significantDigits = fraction.slice(leadingZeros, leadingZeros + 2);
  if (+significantDigits === 0) return '00';

  if (leadingZeros >= 4) return `0${toSubscript(leadingZeros)}${significantDigits}`;
  return `${'0'.repeat(leadingZeros)}${significantDigits}`;
}

export function formatCurrency(
  value: string | number,
  { valueIfNaN = '', currency = store.getState().settings.nativeCurrency }: CurrencyFormatterOptions = {}
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
  const formattedFraction = formatFraction(fraction);
  // if it ends with a non-numeric character, it's in compact notation like '1.2K'
  if (isNaN(+formattedWhole[formattedWhole.length - 1])) return `${currencySymbol}${formattedWhole}`;

  return `${currencySymbol}${formattedWhole}.${formattedFraction}`;
}
