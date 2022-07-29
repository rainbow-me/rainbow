import currency from 'currency.js';
import { BigNumber, BigNumberish, ethers, FixedNumber } from 'ethers';
import { isNil } from 'lodash';
import { supportedNativeCurrencies } from '@rainbow-me/references';

interface Dictionary<T> {
  [index: string]: T;
}
type ValueKeyIteratee<T> = (value: T, key: string) => unknown;
type nativeCurrencyType = typeof supportedNativeCurrencies;

const stringify = (value: BigNumberish) => {
  return value.toString();
};

export const add = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): number => {
  const numberOneAsNumber =
    typeof numberOne === 'number'
      ? numberOne
      : parseFloat(numberOne?.toString());
  const numberTwoAsNumber =
    typeof numberTwo === 'number'
      ? numberTwo
      : parseFloat(numberTwo?.toString());
  return numberOneAsNumber + numberTwoAsNumber;
};

export const subtract = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): number => {
  const numberOneAsNumber =
    typeof numberOne === 'number'
      ? numberOne
      : parseFloat(numberOne?.toString());
  const numberTwoAsNumber =
    typeof numberTwo === 'number'
      ? numberTwo
      : parseFloat(numberTwo?.toString());

  return numberOneAsNumber - numberTwoAsNumber;
};
export const multiply = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): number => {
  const numberOneAsNumber =
    typeof numberOne === 'number'
      ? numberOne
      : parseFloat(numberOne?.toString());
  const numberTwoAsNumber =
    typeof numberTwo === 'number'
      ? numberTwo
      : parseFloat(numberTwo?.toString());

  return numberOneAsNumber * numberTwoAsNumber;
};

export const divide = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): number => {
  const numberOneAsNumber =
    typeof numberOne === 'number'
      ? numberOne
      : parseFloat(numberOne?.toString());
  const numberTwoAsNumber =
    typeof numberTwo === 'number'
      ? numberTwo
      : parseFloat(numberTwo?.toString());

  if (!(numberOne || numberTwo)) return 0;
  return numberOneAsNumber / numberTwoAsNumber;
};

export const convertAmountToRawAmount = (
  value: BigNumberish,
  decimals: number | string
): string => {
  if (Number(value.toString()) === 0) return '0';
  return ethers.utils.parseUnits(value.toString(), decimals).toString();
};

export const isZero = (value: BigNumberish): boolean =>
  value?.toString() === '0';

export const toFixedDecimals = (
  value: BigNumberish,
  decimals: number
): string => {
  return Number(value?.toString() || '0').toFixed(decimals);
};

export const greaterThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => {
  if (typeof numberOne === 'number' && typeof numberTwo === 'number') {
    return numberOne > numberTwo;
  }
  return (
    Number(numberOne?.toString() || '0') > Number(numberTwo?.toString() || '0')
  );
};

export const greaterThanOrEqualTo = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => {
  if (typeof numberOne === 'number' && typeof numberTwo === 'number') {
    return numberOne >= numberTwo;
  }
  return (
    Number(numberOne?.toString() || '0') >= Number(numberTwo?.toString() || '0')
  );
};

export const isEqual = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => {
  if (typeof numberOne === 'number' && typeof numberTwo === 'number') {
    return numberOne === numberTwo;
  }
  return (
    Number(numberOne?.toString() || '0') ===
    Number(numberTwo?.toString() || '0')
  );
};

export const mod = (numberOne: BigNumberish, numberTwo: BigNumberish): string =>
  stringify(BigNumber.from(numberOne).mod(BigNumber.from(numberTwo)));

/**
 * @desc count value's number of decimals places
 * @param  {String}   value
 * @return {String}
 */
export const countDecimalPlaces = (value: BigNumberish): number => {
  const decimals = value?.toString().split('.')[1];
  return decimals ? decimals.length : 0;
};
/**
 * @desc update the amount to display precision
 * equivalent to ~0.01 of the native price
 * or use most significant decimal
 * if the updated precision amounts to zero
 * @param  {String}   amount
 * @param  {String}   nativePrice
 * @return {String}   updated amount
 */
export const updatePrecisionToDisplay = (
  amount: BigNumberish | null,
  nativePrice?: BigNumberish | null
): string => {
  if (!amount) return '0';
  if (!nativePrice) return stringify(amount);
  return Number(amount).toPrecision();
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
  return Number(inputOne?.toString()).toFixed(decimals);
};

/**
 * @desc convert hex to number string
 * @param  {String} hex
 * @return {String}
 */
export const convertHexToString = (hex: BigNumberish): string =>
  stringify(BigNumber.from(hex.toString()));

/**
 * Converts a string to a hex string.
 * @param value The number.
 * @return The hex string (WITHOUT 0x prefix).
 */
export const convertStringToHex = (stringToConvert: string): string => {
  // Convert hex and remove 0x prefix
  const ret = BigNumber.from(stringToConvert).toHexString().substring(2);
  // Remove padding zero if any
  if (ret.length > 1 && ret.substring(0, 1) === '0') {
    return ret.substring(1);
  }
  return ret;
};

export const addDisplay = (numberOne: string, numberTwo: string): string => {
  const template = numberOne.split(/^(\D*)(.*)/);
  const display = currency(numberOne, { symbol: '' }).add(numberTwo).format();
  return [template[1], display].join('');
};

export const addBuffer = (
  numberOne: BigNumberish,
  buffer: BigNumberish = '1.2'
): string => stringify(multiply(numberOne, buffer));

export const fraction = (
  target: BigNumberish,
  numerator: BigNumberish,
  denominator: BigNumberish
): string => {
  if (!target || !numerator || !denominator) return '0';

  const targetFixedNum = FixedNumber.from(target.toString());
  const numeratorFixedNum = FixedNumber.from(numerator.toString());
  const denominatorFixedNum = FixedNumber.from(denominator.toString());

  return targetFixedNum
    .mulUnsafe(numeratorFixedNum)
    .divUnsafe(denominatorFixedNum)
    .toString();
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
  decimals: number = 18
): string => {
  if (isNil(priceUnit) || isZero(priceUnit)) return '0';
  return FixedNumber.from(value.toString())
    .divUnsafe(FixedNumber.from(priceUnit.toString()))
    .round(decimals)
    .toUnsafeFloat()
    .toString();
};

export const convertStringToNumber = (value: BigNumberish) =>
  parseFloat(value.toString());

export const lessThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => {
  if (typeof numberOne === 'number' && typeof numberTwo === 'number') {
    return numberOne < numberTwo;
  }
  return (
    Number(numberOne?.toString() || '0') < Number(numberTwo?.toString() || '0')
  );
};

export const handleSignificantDecimalsWithThreshold = (
  value: BigNumberish,
  decimals: number,
  buffer: number = 3,
  threshold: string = '0.0001'
) => {
  const result = handleSignificantDecimals(value, decimals, buffer);
  return lessThan(result, threshold) ? `< ${threshold}` : result;
};

export const handleSignificantDecimals = (
  value: BigNumberish,
  decimals: number,
  buffer: number = 3,
  skipDecimals = false
): string => {
  if (Math.abs(Number(value.toString())) < 1) {
    decimals =
      Number(value.toString()).toString().slice(2).search(/[^0]/g) + buffer;
    decimals = Math.min(decimals, 8);
  } else {
    decimals = Math.min(decimals, buffer);
  }
  const result = Number(value.toString()).toFixed(decimals);
  const numberOfDecimals = countDecimalPlaces(result);

  const ret =
    numberOfDecimals <= 2
      ? formatLocale(Number(result).toFixed(skipDecimals ? 0 : 2))
      : formatLocale(result);
  return ret;
};

const formatLocale = (value: string) => {
  const parts = value.split('.');
  if (parts.length > 1) {
    // remove trailing zeros
    let decimals = parts[1] === '000' ? '00' : parts[1];
    if (
      decimals.length > 2 &&
      decimals.substring(decimals.length - 1) === '0'
    ) {
      decimals = decimals.substring(0, decimals.length - 1);
    }
    const integers = Number(parts[0]).toLocaleString();
    return `${integers}.${decimals}`;
  }
  return value;
};

/**
 * @desc convert from asset BigNumber amount to native price BigNumber amount
 */
export const convertAmountToNativeAmount = (
  amount: BigNumberish,
  priceUnit: BigNumberish
): number => multiply(amount, priceUnit);

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountAndPriceToNativeDisplay = (
  amount: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: keyof nativeCurrencyType,
  buffer?: number,
  skipDecimals: boolean = false
): { amount: number; display: string } => {
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
  asset: { decimals: number },
  buffer?: number
) => {
  const decimals = asset?.decimals ?? 18;
  const assetBalance = convertRawAmountToDecimalFormat(value, decimals);

  return {
    amount: assetBalance,
    amountNum: parseFloat(assetBalance),
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
  const display = handleSignificantDecimals(value, decimals, buffer, false);
  return `${display} ${asset?.symbol || ''}`;
};

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountToPercentageDisplay = (
  value: BigNumberish,
  decimals: number = 2,
  buffer?: number
): string => {
  const display = handleSignificantDecimals(value, decimals, buffer);
  return `${display}%`;
};

/**
 * @desc convert from amount to display formatted string
 * with a threshold percent
 */
export const convertAmountToPercentageDisplayWithThreshold = (
  value: BigNumberish,
  decimals: number = 2,
  threshold: string = '0.0001'
): string => {
  if (lessThan(value, threshold)) {
    return '< 0.01%';
  } else {
    const display = (Number(value.toString()) * 100).toFixed(decimals);
    return `${display}%`;
  }
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplay = (
  value: BigNumberish,
  nativeCurrency: keyof nativeCurrencyType,
  buffer?: number,
  skipDecimals?: boolean
) => {
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { decimals } = nativeSelected;
  const display = handleSignificantDecimals(
    value,
    decimals,
    buffer,
    skipDecimals
  );

  if (nativeSelected.alignment === 'left') {
    return `${nativeSelected.symbol}${display}`;
  }
  return `${display} ${nativeSelected.symbol}`;
};

/**
 * @desc convert from raw amount to decimal format
 */
export const convertRawAmountToDecimalFormat = (
  value: BigNumberish,
  decimals: number = 18
): string => ethers.utils.formatUnits(value, decimals);

export const fromWei = (number: BigNumberish): string =>
  ethers.utils.formatEther((number || 0).toString());

/**
 * @desc Promise that will resolve after the ms interval
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
