import BigNumber from 'bignumber.js';
import { get, isNil } from 'lodash';
import supportedNativeCurrencies from '../references/native-currencies.json';

type BigNumberish = number | string | BigNumber;

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
  amount: BigNumberish,
  nativePrice: BigNumberish,
  roundUp: boolean = false
): BigNumberish => {
  if (!amount) return 0;
  if (!nativePrice) return amount;
  const roundingMode = roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN;
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
  buffer: number = 3,
  threshold: string = '0.0001'
) => {
  const result = handleSignificantDecimals(value, decimals, buffer);
  return lessThan(result, threshold) ? `< ${threshold}` : result;
};

export const handleSignificantDecimals = (
  value: BigNumberish,
  decimals: number,
  buffer: number = 3
): string => {
  if (lessThan(new BigNumber(value).abs(), 1)) {
    decimals =
      new BigNumber(value)
        .toFixed()
        .slice(2)
        .search(/[^0]/g) + buffer;
    decimals = Math.min(decimals, 8);
  } else {
    decimals = Math.min(decimals, buffer);
  }
  const result = new BigNumber(
    new BigNumber(value).toFixed(decimals)
  ).toFixed();
  const resultBN = new BigNumber(result);
  return resultBN.dp() <= 2 ? resultBN.toFormat(2) : resultBN.toFormat();
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
  buffer?: number
): { amount: string; display: string } => {
  const nativeBalanceRaw = convertAmountToNativeAmount(amount, priceUnit);
  const nativeDisplay = convertAmountToNativeDisplay(
    nativeBalanceRaw,
    nativeCurrency,
    buffer
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
  const display = handleSignificantDecimals(value, decimals, buffer);
  return `${display} ${get(asset, 'symbol', '')}`;
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
 * @desc convert from bips amount to percentage format
 */
export const convertBipsToPercentage = (
  value: BigNumberish,
  decimals: number = 2
): string => new BigNumber(value).shiftedBy(-2).toFixed(decimals);

/**
 * @desc convert from amount value to display formatted string
 */
export const convertAmountToNativeDisplay = (
  value: BigNumberish,
  nativeCurrency: string,
  buffer?: number
) => {
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
  const { decimals } = nativeSelected;
  const display = handleSignificantDecimals(value, decimals, buffer);
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
): string =>
  new BigNumber(value).dividedBy(new BigNumber(10).pow(decimals)).toFixed();

export const fromWei = (number: BigNumberish): string =>
  convertRawAmountToDecimalFormat(number, 18);

/**
 * @desc Promise that will resolve after the ms interval
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
