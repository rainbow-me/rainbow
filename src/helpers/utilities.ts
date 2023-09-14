import BigNumber from 'bignumber.js';
import currency from 'currency.js';
import { isNil } from 'lodash';
import { supportedNativeCurrencies } from '@/references';

type BigNumberish = number | string | BigNumber;

interface Dictionary<T> {
  [index: string]: T;
}

type ValueKeyIteratee<T> = (value: T, key: string) => unknown;
type nativeCurrencyType = typeof supportedNativeCurrencies;

export const abs = (value: BigNumberish): string =>
  new BigNumber(value).abs().toFixed();

export const isPositive = (value: BigNumberish): boolean =>
  new BigNumber(value).isPositive();

export const subtract = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string => new BigNumber(numberOne).minus(new BigNumber(numberTwo)).toFixed();

export const convertAmountToRawAmount = (
  value: BigNumberish,
  decimals: number | string
): string =>
  new BigNumber(value).times(new BigNumber(10).pow(decimals)).toFixed();

export const isZero = (value: BigNumberish): boolean =>
  new BigNumber(value).isZero();

export const toFixedDecimals = (
  value: BigNumberish,
  decimals: number
): string => new BigNumber(value).toFixed(decimals);

export const convertNumberToString = (value: BigNumberish): string =>
  new BigNumber(value).toFixed();

export const greaterThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => new BigNumber(numberOne).gt(numberTwo);

export const greaterThanOrEqualTo = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => new BigNumber(numberOne).gte(numberTwo);

export const isEqual = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => new BigNumber(numberOne).eq(numberTwo);

export const formatFixedDecimals = (
  value: BigNumberish,
  decimals: number
): string => {
  const _value = convertNumberToString(value);
  const _decimals = convertStringToNumber(decimals);
  return new BigNumber(new BigNumber(_value).toFixed(_decimals)).toFixed();
};

export const mod = (numberOne: BigNumberish, numberTwo: BigNumberish): string =>
  new BigNumber(numberOne).mod(new BigNumber(numberTwo)).toFixed();

/**
 * @desc real floor divides two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const floorDivide = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string =>
  new BigNumber(numberOne)
    .dividedToIntegerBy(new BigNumber(numberTwo))
    .toFixed();

/**
 * @desc count value's number of decimals places
 * @param  {String}   value
 * @return {String}
 */
export const countDecimalPlaces = (value: BigNumberish): number =>
  new BigNumber(value).dp();

/**
 * @desc update the amount to display precision
 * equivalent to ~0.01 of the native price
 * or use most significant decimal
 * if the updated precision amounts to zero
 * @param  {String}   amount
 * @param  {String}   nativePrice
 * @param  {Boolean}  use rounding up mode
 * @return {String}   updated amount
 */
export const updatePrecisionToDisplay = (
  amount: BigNumberish | null,
  nativePrice?: BigNumberish | null,
  roundUp = false
): string => {
  if (!amount) return '0';
  const roundingMode = roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN;
  if (!nativePrice)
    return new BigNumber(amount).decimalPlaces(6, roundingMode).toFixed();
  const bnAmount = new BigNumber(amount);
  const significantDigitsOfNativePriceInteger = new BigNumber(nativePrice)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .sd(true);
  const truncatedPrecision = new BigNumber(
    significantDigitsOfNativePriceInteger
  )
    .plus(2, 10)
    .toNumber();
  const truncatedAmount = bnAmount.decimalPlaces(
    truncatedPrecision,
    BigNumber.ROUND_DOWN
  );
  return truncatedAmount.isZero()
    ? new BigNumber(bnAmount.toPrecision(1, roundingMode)).toFixed()
    : bnAmount.decimalPlaces(truncatedPrecision, roundingMode).toFixed();
};

/**
 * @desc format inputOne value to signficant decimals given inputTwo
 * @param  {String}   inputOne
 * @param  {String}   inputTwo
 * @return {String}
 */
// TODO revisit logic, at least rename so it is not native amount dp
export const formatInputDecimals = (
  inputOne: BigNumberish,
  inputTwo: BigNumberish
): string => {
  const _nativeAmountDecimalPlaces = countDecimalPlaces(inputTwo);
  const decimals =
    _nativeAmountDecimalPlaces > 8 ? _nativeAmountDecimalPlaces : 8;
  const result = new BigNumber(formatFixedDecimals(inputOne, decimals))
    .toFormat()
    .replace(/,/g, '');
  return result;
};

/**
 * @desc convert hex to number string
 * @param  {String} hex
 * @return {String}
 */
export const convertHexToString = (hex: BigNumberish): string =>
  new BigNumber(hex).toFixed();

export const convertStringToHex = (stringToConvert: string): string =>
  new BigNumber(stringToConvert).toString(16);

export const add = (numberOne: BigNumberish, numberTwo: BigNumberish): string =>
  new BigNumber(numberOne).plus(numberTwo).toFixed();

export const addDisplay = (numberOne: string, numberTwo: string): string => {
  const unit = numberOne.replace(/[\d.-]/g, '');
  const leftAlignedUnit = numberOne.indexOf(unit) === 0;
  return currency(0, { symbol: unit, pattern: leftAlignedUnit ? '!#' : '#!' })
    .add(numberOne)
    .add(numberTwo)
    .format();
};

export const multiply = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string => new BigNumber(numberOne).times(numberTwo).toFixed();

export const addBuffer = (
  numberOne: BigNumberish,
  buffer: BigNumberish = '1.2'
): string => new BigNumber(numberOne).times(buffer).toFixed(0);

export const divide = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string => {
  if (!(numberOne || numberTwo)) return '0';
  return new BigNumber(numberOne).dividedBy(numberTwo).toFixed();
};

export const fraction = (
  target: BigNumberish,
  numerator: BigNumberish,
  denominator: BigNumberish
): string => {
  if (!target || !numerator || !denominator) return '0';
  return new BigNumber(target)
    .times(numerator)
    .dividedBy(denominator)
    .toFixed(0);
};

/**
 * @desc convert to asset amount units from native price value units
 * @param  {String}   value
 * @param  {Object}   asset
 * @param  {Number}   priceUnit
 * @return {String}
 */
export const convertAmountFromNativeValue = (
  value: BigNumberish,
  priceUnit: BigNumberish | null,
  decimals = 18
): string => {
  if (isNil(priceUnit) || isZero(priceUnit)) return '0';
  return new BigNumber(
    new BigNumber(value)
      .dividedBy(priceUnit)
      .toFixed(decimals, BigNumber.ROUND_DOWN)
  ).toFixed();
};

export const convertStringToNumber = (value: BigNumberish) =>
  new BigNumber(value).toNumber();

export const lessThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => new BigNumber(numberOne).lt(numberTwo);

export const handleSignificantDecimalsWithThreshold = (
  value: BigNumberish,
  decimals: number,
  buffer = 3,
  threshold = '0.0001'
) => {
  const result = handleSignificantDecimals(value, decimals, buffer);
  return lessThan(result, threshold) ? `< ${threshold}` : result;
};

/**
 * Converts a `BigNumber` to a string abbreviation with a suffix like "k", "m", or "b".
 * Rounds to 1 decimal place, stripping trailing zeros.
 * Example: 3100000000 => "3.1b"
 */
export const abbreviateBigNumber = (
  value: BigNumber,
  buffer: number
): string => {
  // converts a big number like 3,100,000,000 to "3.1" or 3,000,000 to "3"
  const getNumericCounterpart = (value: BigNumber): string =>
    value.toFormat(1).replace(/\.?0+$/, '');

  if (value.isGreaterThanOrEqualTo(1_000_000_000)) {
    return getNumericCounterpart(value.div(1_000_000_000)) + 'b';
  } else if (value.isGreaterThanOrEqualTo(1_000_000)) {
    return getNumericCounterpart(value.div(1_000_000)) + 'm';
  } else if (value.isGreaterThanOrEqualTo(1000)) {
    return getNumericCounterpart(value.div(1000)) + 'k';
  } else if (value.isEqualTo(0)) {
    // just return '0'
    return value.toString();
  } else {
    // only display `buffer` number of digits after the decimal point
    // trim trailing zeros
    const roundedValue = value.toFormat(buffer).replace(/\.?0+$/, '');
    // if this rounded value is 0, indicate that the actual value is less than 0.0...01
    return roundedValue === '0'
      ? `< 0.${'0'.repeat(buffer - 1)}1`
      : roundedValue;
  }
};

/**
 * Abbreviates number like 1,200,000 to "1.2m", 1,000 to "1k", etc.
 * Rounds to 1 decimal place, stripping trailing zeros.
 */
export const abbreviateNumber = (number: number): string => {
  let prefix = number;
  let suffix = '';
  if (number >= 1_000_000_000) {
    prefix = number / 1_000_000_000;
    suffix = 'b';
  } else if (number >= 1_000_000) {
    prefix = number / 1_000_000;
    suffix = 'm';
  } else if (number >= 1000) {
    prefix = number / 1000;
    suffix = 'k';
  }
  return prefix.toFixed(1).replace(/\.0$/, '') + suffix;
};

export const handleSignificantDecimals = (
  value: BigNumberish,
  decimals: number,
  buffer = 3,
  skipDecimals = false,
  abbreviate = false
): string => {
  if (lessThan(new BigNumber(value).abs(), 1)) {
    decimals = new BigNumber(value).toFixed().slice(2).search(/[^0]/g) + buffer;
    decimals = Math.min(decimals, 8);
  } else {
    decimals = Math.min(decimals, buffer);
  }
  const result = new BigNumber(
    new BigNumber(value).toFixed(decimals)
  ).toFixed();
  const resultBN = new BigNumber(result);
  if (abbreviate) {
    return abbreviateBigNumber(resultBN, buffer);
  }
  return resultBN.dp() <= 2
    ? resultBN.toFormat(skipDecimals ? 0 : 2)
    : resultBN.toFormat();
};

/**
 * @desc convert from asset BigNumber amount to native price BigNumber amount
 */
export const convertAmountToNativeAmount = (
  amount: BigNumberish,
  priceUnit: BigNumberish
): string => multiply(amount, priceUnit);

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountAndPriceToNativeDisplay = (
  amount: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: keyof nativeCurrencyType,
  buffer?: number,
  skipDecimals = false
): { amount: string; display: string } => {
  const nativeBalanceRaw = convertAmountToNativeAmount(amount, priceUnit);
  const nativeDisplay = convertAmountToNativeDisplay(
    nativeBalanceRaw,
    nativeCurrency,
    buffer,
    skipDecimals
  );
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
  nativeCurrency: keyof nativeCurrencyType,
  buffer?: number
) => {
  const assetBalance = convertRawAmountToDecimalFormat(
    rawAmount,
    assetDecimals
  );
  return convertAmountAndPriceToNativeDisplay(
    assetBalance,
    priceUnit,
    nativeCurrency,
    buffer
  );
};

/**
 * @desc convert from raw amount to balance object
 */
export const convertRawAmountToBalance = (
  value: BigNumberish,
  asset: { decimals: number; symbol?: string },
  buffer?: number
) => {
  const decimals = asset?.decimals ?? 18;
  const assetBalance = convertRawAmountToDecimalFormat(value, decimals);

  return {
    amount: assetBalance,
    display: convertAmountToBalanceDisplay(assetBalance, asset, buffer),
  };
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToBalanceDisplay = (
  value: BigNumberish,
  asset: { decimals: number; symbol?: string },
  buffer?: number
) => {
  const decimals = asset?.decimals ?? 18;
  const display = handleSignificantDecimals(value, decimals, buffer);
  return `${display} ${asset?.symbol || ''}`;
};

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountToPercentageDisplay = (
  value: BigNumberish,
  decimals = 2,
  buffer?: number,
  skipDecimals?: boolean
): string => {
  const display = handleSignificantDecimals(
    value,
    decimals,
    buffer,
    skipDecimals
  );
  return `${display}%`;
};

/**
 * @desc convert from amount to display formatted string
 * with a threshold percent
 */
export const convertAmountToPercentageDisplayWithThreshold = (
  value: BigNumberish,
  decimals = 2,
  threshold = '0.0001'
): string => {
  if (lessThan(value, threshold)) {
    return '< 0.01%';
  } else {
    const display = new BigNumber(value).times(100).toFixed(decimals);
    return `${display}%`;
  }
};

/**
 * @desc convert from bips amount to percentage format
 */
export const convertBipsToPercentage = (
  value: BigNumberish | null,
  decimals = 2
): string => {
  if (value === null) return '0';
  return new BigNumber(value || 0).shiftedBy(-2).toFixed(decimals);
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplay = (
  value: BigNumberish,
  nativeCurrency: keyof nativeCurrencyType,
  buffer?: number,
  skipDecimals?: boolean,
  abbreviate?: boolean
) => {
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { decimals } = nativeSelected;
  const display = handleSignificantDecimals(
    value,
    decimals,
    buffer,
    skipDecimals,
    abbreviate
  );
  if (nativeSelected.alignment === 'left') {
    return `${nativeSelected.symbol}${display}`;
  }
  return `${display} ${nativeSelected.symbol}`;
};

/**
 * @desc convert from raw amount to rounded decimal
 */
export const convertRawAmountToRoundedDecimal = (
  value: BigNumberish,
  decimals = 18,
  roundTo = 0
): number => {
  if (roundTo) {
    const roundingFactor = 10 ** roundTo;
    return (
      Math.round(
        new BigNumber(value)
          .dividedBy(new BigNumber(10).pow(decimals))
          .toNumber() * roundingFactor
      ) / roundingFactor
    );
  } else {
    return new BigNumber(value)
      .dividedBy(new BigNumber(10).pow(decimals))
      .toNumber();
  }
};

/**
 * @desc convert from raw amount to decimal format
 */
export const convertRawAmountToDecimalFormat = (
  value: BigNumberish,
  decimals = 18
): string =>
  new BigNumber(value).dividedBy(new BigNumber(10).pow(decimals)).toFixed();

export const fromWei = (number: BigNumberish): string =>
  convertRawAmountToDecimalFormat(number, 18);

/**
 * @desc Promise that will resolve after the ms interval
 *
 * @deprecated use `@/utils/delay`
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const flattenDeep = (arr: unknown[]): unknown[] =>
  arr.flatMap(subArray =>
    Array.isArray(subArray) ? flattenDeep(subArray) : subArray
  );

export const times = (n: number, fn: (i: number) => unknown) =>
  Array.from({ length: n }, (_, i) => fn(i));

/**
 * @desc Creates an object composed of the omitted object properties by some predicate function.
 */
export const omitBy = <T>(
  obj: Dictionary<T>,
  predicate: ValueKeyIteratee<T>
): Dictionary<T> => {
  return Object.keys(obj)
    .filter(k => !predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as Dictionary<T>);
};

/**
 * @desc Can omit only flattened key, will not work with nested props like 'key.someObj.value'
 */
export const omitFlatten = <T extends object, K extends keyof T>(
  obj: T | null | undefined,
  keys: K[] | K
): Omit<T, K> => {
  const keysArr = Array.isArray(keys) ? keys : [keys];
  const newObj: any = {};
  const keysArrObj: any = {};
  for (const key of keysArr) {
    keysArrObj[key] = true;
  }
  for (const key in obj) {
    if (!keysArrObj[key]) newObj[key] = obj[key];
  }
  return newObj;
};

/**
 * Creates an object composed of the picked object properties.
 * @param obj The source object
 * @param paths The property paths to pick
 */
export const pickShallow = <T extends object, K extends keyof T>(
  obj: T,
  paths: K[]
): Pick<T, K> => {
  return paths.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
      return acc;
    }
    return acc;
  }, {} as Pick<T, K>);
};

/**
 * Creates an object composed of the picked object properties by some predicate function.
 * @param obj The source object
 * @param predicate The function invoked per property
 */
export const pickBy = <T>(
  obj: Dictionary<T>,
  predicate: ValueKeyIteratee<T>
): Dictionary<T> => {
  return Object.keys(obj)
    .filter(k => predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as Dictionary<T>);
};

/**
 * Formats ms since epoch into a string of the form "Xd Yh Zm".
 * Doesn't support months, or years.
 * @param ms ms since epoch
 * @returns string of the format "Xd Yh Zm"
 */
export const getFormattedTimeQuantity = (ms: number): string => {
  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  const formattedMinutes = minutes || (!hours && !days) ? minutes + 'm' : '';
  const formattedHours = hours ? hours + 'h ' : '';
  const formattedDays = days ? days + 'd ' : '';

  return (formattedDays + formattedHours + formattedMinutes).trim();
};
