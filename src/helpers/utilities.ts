import currency from 'currency.js';
import { BigNumber, BigNumberish, ethers, FixedNumber } from 'ethers';
import { get, isNil } from 'lodash';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const toFixed = (value: BigNumberish) => {
  return value.toString();
};

export const add = (numberOne: BigNumberish, numberTwo: BigNumberish): string =>
  toFixed(parseFloat(numberOne.toString()) + parseFloat(numberTwo.toString()));

export const subtract = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string =>
  toFixed(parseFloat(numberOne.toString()) - parseFloat(numberTwo.toString()));

export const multiply = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string =>
  toFixed(parseFloat(numberOne.toString()) * parseFloat(numberTwo.toString()));

export const divide = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): string => {
  if (!(numberOne || numberTwo)) return '0';
  return toFixed(
    parseFloat(numberOne.toString()) / parseFloat(numberTwo.toString())
  );
};

export const convertAmountToRawAmount = (
  value: BigNumberish,
  decimals: number | string
): string => ethers.utils.formatUnits(value.toString(), decimals);

export const isZero = (value: BigNumberish): boolean =>
  value.toString() === '0';

export const toFixedDecimals = (
  value: BigNumberish,
  decimals: number
): string => Number(value.toString()).toFixed(decimals);

export const greaterThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => Number(numberOne?.toString()) > Number(numberTwo?.toString());

export const greaterThanOrEqualTo = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => Number(numberOne?.toString()) >= Number(numberTwo?.toString());

export const isEqual = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => Number(numberOne?.toString()) === Number(numberTwo?.toString());

export const mod = (numberOne: BigNumberish, numberTwo: BigNumberish): string =>
  toFixed(BigNumber.from(numberOne).mod(BigNumber.from(numberTwo)));

/**
 * @desc count value's number of decimals places
 * @param  {String}   value
 * @return {String}
 */
export const countDecimalPlaces = (value: BigNumberish): number => {
  const decimals = value.toString().split('.')[1];
  return decimals ? decimals.length : 0;
};
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roundUp: boolean = false
): string => {
  if (!amount) return '0';
  if (!nativePrice) return toFixed(amount);
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
  return Number(Number(inputOne.toString()).toFixed(decimals))
    .toLocaleString()
    .replace(/,/g, '');
};

/**
 * @desc convert hex to number string
 * @param  {String} hex
 * @return {String}
 */
export const convertHexToString = (hex: BigNumberish): string =>
  toFixed(BigNumber.from(hex.toString()));

export const convertStringToHex = (stringToConvert: string): string =>
  FixedNumber.from(stringToConvert).toHexString();

export const addDisplay = (numberOne: string, numberTwo: string): string => {
  const template = numberOne.split(/\d+\.\d+/);
  const display = currency(numberOne, { symbol: '' }).add(numberTwo).format();
  return template.map(item => (item === '' ? `${display}` : item)).join('');
};

export const addBuffer = (
  numberOne: BigNumberish,
  buffer: BigNumberish = '1.2'
): string => multiply(numberOne, buffer);

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
  return toFixed(BigNumber.from(priceUnit.toString()).div(decimals).toNumber());
};

export const convertStringToNumber = (value: BigNumberish) =>
  parseFloat(value.toString());

export const lessThan = (
  numberOne: BigNumberish,
  numberTwo: BigNumberish
): boolean => Number(numberOne?.toString()) < Number(numberTwo?.toString());

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
    const decimals = parts[1] === '000' ? '00' : parts[1];
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
): string => multiply(amount, priceUnit);

/**
 * @desc convert from amount to display formatted string
 */
export const convertAmountAndPriceToNativeDisplay = (
  amount: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string,
  buffer?: number,
  skipDecimals: boolean = false
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
  nativeCurrency: string,
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
  const decimals = get(asset, 'decimals', 18);
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
  asset: { decimals: number },
  buffer?: number
) => {
  const decimals = get(asset, 'decimals', 18);
  const symbol = get(asset, 'symbol', '');
  const display = handleSignificantDecimals(value, decimals, buffer, false);
  const ret = `${display} ${symbol}`;
  return ret;
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
    const display = FixedNumber.from(value.toString())
      .mulUnsafe(FixedNumber.from('100'))
      .round(decimals)
      .toString();
    return `${display}%`;
  }
};

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplay = (
  value: BigNumberish,
  nativeCurrency: string,
  buffer?: number,
  skipDecimals?: boolean
) => {
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
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
  convertRawAmountToDecimalFormat(number, 18);

/**
 * @desc Promise that will resolve after the ms interval
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
