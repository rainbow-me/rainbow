import { memoFn } from '../utils/memoFn';
import { supportedNativeCurrencies } from '@/references';
import { NativeCurrencyKey } from '@/entities';
import { convertAmountToNativeDisplayWorklet } from './utilities';
import {
  equalWorklet as safeEqualWorklet,
  divWorklet as safeDivWorklet,
  greaterThanOrEqualToWorklet as safeGreaterThanOrEqualToWorklet,
  isNumberStringWorklet as safeIsNumberStringWorklet,
  lessThanWorklet as safeLessThanWorklet,
  mulWorklet as safeMulWorklet,
  orderOfMagnitudeWorklet as safeOrderOfMagnitudeWorklet,
  powWorklet as safePowWorklet,
  removeDecimalWorklet as safeRemoveDecimalWorklet,
  toFixedWorklet as safeToFixedWorklet,
  toStringWorklet as safeToStringWorklet,
} from '../safe-math/SafeMath';

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
  currency: NativeCurrencyKey;
};

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

const toSubscript = (digit: string): string => {
  'worklet';
  if (digit.length !== 1) {
    throw new Error('toSubscript expects a single character digit [0-9]');
  }
  return subscriptDigits[digit] || digit;
};

const toSuperscript = (digit: string): string => {
  'worklet';
  if (digit.length !== 1) {
    throw new Error('toSuperscript expects a single character digit [0-9]');
  }
  return superscriptDigits[digit] || digit;
};

/*
  converts 6.9e-7 to 0.00000069
*/
function toDecimalString(num: number): string {
  return num.toFixed(20).replace(/\.?0+$/, '');
}

export function formatFractionWorklet(fraction: string): string {
  'worklet';
  let leadingZeros = 0;
  for (let i = 0; i < fraction.length; i++) {
    if (fraction[i] === '0') {
      leadingZeros++;
    } else {
      break;
    }
  }

  const significantPart = fraction.slice(leadingZeros);
  if (significantPart.length === 0 || /^[0]+$/.test(significantPart)) {
    return '00';
  }

  const significantDigits = significantPart.slice(0, 2).padEnd(2, '0');

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

export function formatCurrency(value: string | number, { valueIfNaN = '', currency }: CurrencyFormatterOptions): string {
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

const SUBSCRIPT_THRESHOLD_MAGNITUDE = -4;

const zeroFormattedRegex = /^[-+]?0+(\.0+)?$/;

export function toCompactNotation({
  value,
  prefix,
  decimalPlaces,
  currency,
}: {
  value: string | number;
  prefix?: string;
  decimalPlaces?: number;
  currency?: NativeCurrencyKey;
}): string {
  'worklet';
  const valueString = safeToStringWorklet(value);
  if (!safeIsNumberStringWorklet(valueString)) return valueString ?? '';

  const numericString = valueString;
  const isNegative = safeLessThanWorklet(numericString, '0');
  const absNumericString = isNegative ? safeMulWorklet(numericString, '-1') : numericString;
  const sign = isNegative ? '-' : '';

  if (safeEqualWorklet(absNumericString, '0')) {
    const formattedValue = safeToFixedWorklet('0', decimalPlaces ?? 2);
    return prefix ? `${prefix}${formattedValue}` : `${formattedValue}`;
  }

  const magnitude = safeOrderOfMagnitudeWorklet(absNumericString);

  // Handle >= 1
  if (safeGreaterThanOrEqualToWorklet(absNumericString, '1')) {
    // Scientific notation for >= 1,000,000
    if (magnitude >= 6) {
      const divisor = safePowWorklet('10', magnitude.toString());
      const mantissa = safeDivWorklet(absNumericString, divisor);
      const formattedMantissa = safeToFixedWorklet(mantissa, 2);
      const superscriptExponent = `${magnitude
        .toString()
        .split('')
        .map(char => toSuperscript(char))
        .join('')}`;
      return prefix
        ? `${prefix}${sign}${formattedMantissa}×10${superscriptExponent}`
        : `${sign}${formattedMantissa}×10${superscriptExponent}`;
    }

    if (currency) {
      const formattedValue = convertAmountToNativeDisplayWorklet(absNumericString, currency, false, true).replace(
        supportedNativeCurrencies[currency].symbol,
        ''
      );
      return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
    }

    // Fixed decimal for 1 <= abs < 1,000,000
    const formattedValue = safeToFixedWorklet(absNumericString, decimalPlaces ?? 2);
    return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
  }

  if (magnitude >= SUBSCRIPT_THRESHOLD_MAGNITUDE) {
    const targetDecimalPlaces = decimalPlaces ?? 2;
    let formattedValue = safeToFixedWorklet(absNumericString, targetDecimalPlaces);

    const isZeroFormatted = zeroFormattedRegex.test(formattedValue);
    const isActuallyZero = safeEqualWorklet(absNumericString, '0');

    if (isZeroFormatted && !isActuallyZero) {
      const precisionNeeded = Math.abs(magnitude) + 1;
      const adjustedPrecision = Math.max(targetDecimalPlaces, precisionNeeded);
      const morePreciseValue = safeToFixedWorklet(absNumericString, adjustedPrecision);
      if (!zeroFormattedRegex.test(morePreciseValue)) {
        formattedValue = morePreciseValue;
      }
    }

    return prefix ? `${prefix}${sign}${formattedValue}` : `${sign}${formattedValue}`;
  } else {
    const [bigIntNum, fractionDecimalPlaces] = safeRemoveDecimalWorklet(absNumericString);
    let fullFractionString = '';
    if (fractionDecimalPlaces > 0) {
      const positiveBigIntStr = (bigIntNum < 0n ? -bigIntNum : bigIntNum).toString();
      fullFractionString = positiveBigIntStr.padStart(fractionDecimalPlaces, '0');
    } else {
      fullFractionString = (bigIntNum < 0n ? -bigIntNum : bigIntNum).toString();
    }
    const formattedFraction = formatFractionWorklet(fullFractionString);
    return prefix ? `${prefix}${sign}0.${formattedFraction}` : `${sign}0.${formattedFraction}`;
  }
}
