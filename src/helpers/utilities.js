import BigNumber from 'bignumber.js';
import { get } from 'lodash';
import supportedNativeCurrencies from '../references/native-currencies.json';

/**
 * @desc subtracts two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const subtract = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`)
    .minus(BigNumber(`${numberTwo}`))
    .toFixed();

/**
 * @desc convert amount to raw amount
 * @param  {String}   value
 * @param  {Number}   decimals
 * @return {String}
 */
export const convertAmountToRawAmount = (value, decimals) =>
  BigNumber(value)
    .times(BigNumber(10).pow(decimals))
    .toFixed();

export const isZero = value => BigNumber(value).isZero();

/**
 * @desc to fixed decimals
 * @param  {Number}  value
 * @return {String}
 */
export const toFixedDecimals = (value, decimals) =>
  BigNumber(`${value}`).toFixed(decimals);

/**
 * @desc convert from number to string
 * @param  {Number}  value
 * @return {String}
 */
export const convertNumberToString = value => BigNumber(`${value}`).toFixed();

/**
 * @desc compares if numberOne is greater than numberTwo
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {Boolean}
 */
export const greaterThan = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`).gt(numberTwo);

/**
 * @desc compares if numberOne is greater than or equal to numberTwo
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {Boolean}
 */
export const greaterThanOrEqualTo = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`).gte(numberTwo);

/**
 * @desc compares if numberOne is equal to numberTwo
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const isEqual = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`).eq(numberTwo);

/**
 * @desc format fixed number of decimals
 * @param  {String}   value
 * @param  {Number}   decimals
 * @return {String}
 */
export const formatFixedDecimals = (value, decimals) => {
  const _value = convertNumberToString(value);
  const _decimals = convertStringToNumber(decimals);
  const result = BigNumber(BigNumber(_value).toFixed(_decimals)).toFixed();
  return result;
};

/**
 * @desc modulos of two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const mod = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`)
    .mod(BigNumber(`${numberTwo}`))
    .toFixed();

/**
 * @desc calculate the fee for a given amount, percent fee, and fixed fee
 * @param  {Number}   amount (base amount to calculate fee off of)
 * @param  {Number}   percent fee (4% would just be 4)
 * @param  {Number}   fixed fee (flat rate to add)
 * @return {String}   fixed format to 2 decimals with ROUND_HALF_UP
 */
export const feeCalculation = (amount, percentFee, fixedFee) =>
  BigNumber(amount)
    .times(percentFee)
    .dividedBy(100)
    .plus(fixedFee)
    .toFixed(2, BigNumber.ROUND_HALF_UP);

/**
 * @desc real floor divides two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const floorDivide = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`)
    .dividedToIntegerBy(BigNumber(`${numberTwo}`))
    .toFixed();

/**
 * @desc count value's number of decimals places
 * @param  {String}   value
 * @return {String}
 */
export const countDecimalPlaces = value => BigNumber(`${value}`).dp();

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
  amount,
  nativePrice,
  roundUp = false
) => {
  if (!amount) return 0;
  if (!nativePrice) return amount;
  const roundingMode = roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN;
  const bnAmount = BigNumber(`${amount}`);
  const significantDigitsOfNativePriceInteger = BigNumber(`${nativePrice}`)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .sd(true);
  const truncatedPrecision = BigNumber(significantDigitsOfNativePriceInteger)
    .plus(2, 10)
    .toNumber();
  const truncatedAmount = bnAmount.decimalPlaces(
    truncatedPrecision,
    BigNumber.ROUND_DOWN
  );
  return truncatedAmount.isZero()
    ? BigNumber(bnAmount.toPrecision(1, roundingMode)).toFixed()
    : bnAmount.decimalPlaces(truncatedPrecision, roundingMode).toFixed();
};

/**
 * @desc format inputOne value to signficant decimals given inputTwo
 * @param  {String}   inputOne
 * @param  {String}   inputTwo
 * @return {String}
 */
// TODO revisit logic, at least rename so it is not native amount dp
export const formatInputDecimals = (inputOne, inputTwo) => {
  const _nativeAmountDecimalPlaces = countDecimalPlaces(inputTwo);
  const decimals =
    _nativeAmountDecimalPlaces > 8 ? _nativeAmountDecimalPlaces : 8;
  const result = BigNumber(formatFixedDecimals(inputOne, decimals))
    .toFormat()
    .replace(/,/g, '');
  return result;
};

/**
 * @desc convert hex to number string
 * @param  {String} hex
 * @return {String}
 */
export const convertHexToString = hex => BigNumber(`${hex}`).toFixed();

/**
 * @desc convert number to string to hex
 * @param  {String} string
 * @return {String}
 */
export const convertStringToHex = string => BigNumber(`${string}`).toString(16);

/**
 * @desc adds two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const add = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`)
    .plus(BigNumber(`${numberTwo}`))
    .toFixed();

/**
 * @desc multiplies two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const multiply = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`)
    .times(BigNumber(`${numberTwo}`))
    .toFixed();

/**
 * @desc divides two numbers
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const divide = (numberOne, numberTwo) => {
  if (!(numberOne || numberTwo)) return '0';
  return BigNumber(`${numberOne}`)
    .dividedBy(BigNumber(`${numberTwo}`))
    .toFixed();
};

/**
 * @desc convert to asset amount units from native price value units
 * @param  {String}   value
 * @param  {Object}   asset
 * @param  {Number}   priceUnit
 * @return {String}
 */
export const convertAmountFromNativeValue = (value, priceUnit, decimals = 18) =>
  BigNumber(
    BigNumber(value)
      .dividedBy(BigNumber(priceUnit))
      .toFixed(decimals, BigNumber.ROUND_DOWN)
  ).toFixed();

/**
 * @desc convert from string to number
 * @param  {String}  value
 * @return {Number}
 */
export const convertStringToNumber = value => BigNumber(`${value}`).toNumber();

/**
 * @desc compares if numberOne is smaller than numberTwo
 * @param  {Number}   numberOne
 * @param  {Number}   numberTwo
 * @return {String}
 */
export const lessThan = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`).lt(numberTwo);

/**
 * @desc handle signficant decimals
 * @param  {String|Number}   value
 * @param  {Number}   decimals
 * @param  {Number}   buffer
 * @return {String}
 */
export const handleSignificantDecimals = (value, decimals, buffer) => {
  if (
    !BigNumber(`${decimals}`).isInteger() ||
    (buffer && !BigNumber(`${buffer}`).isInteger())
  ) {
    return null;
  }
  buffer = buffer ? convertStringToNumber(buffer) : 3;
  decimals = convertStringToNumber(decimals);
  if (lessThan(BigNumber(`${value}`).abs(), 1)) {
    decimals =
      BigNumber(`${value}`)
        .toFixed()
        .slice(2)
        .slice('')
        .search(/[^0]/g) + buffer;
    decimals = decimals < 8 ? decimals : 8;
  } else {
    decimals = decimals < buffer ? decimals : buffer;
  }
  let result = BigNumber(`${value}`).toFixed(decimals);
  result = BigNumber(`${result}`).toFixed();
  return BigNumber(`${result}`).dp() <= 2
    ? BigNumber(`${result}`).toFormat(2)
    : BigNumber(`${result}`).toFormat();
};

/**
 * @desc convert from asset BigNumber amount to native price BigNumber amount
 * @param  {BigNumber}   value
 * @param  {Object}   asset
 * @param  {Object}   nativePrices
 * @return {BigNumber}
 */
export const convertAmountToNativeAmount = (amount, priceUnit) =>
  multiply(amount, priceUnit);

/**
 * @desc convert from amount to display formatted string
 * @param  {BigNumber}  value
 * @param  {String}     nativeCurrency
 * @return {String}
 */
export const convertAmountAndPriceToNativeDisplay = (
  amount,
  priceUnit,
  nativeCurrency,
  buffer
) => {
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
 * @param  {BigNumber}  value
 * @param  {String}     nativeCurrency
 * @return {String}
 */
export const convertRawAmountToNativeDisplay = (
  rawAmount,
  assetDecimals,
  priceUnit,
  nativeCurrency,
  buffer
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
 * @param  {BigNumber}  value
 * @param  {Object}     asset
 * @param  {Number}     buffer
 * @return {Object}
 */
export const convertRawAmountToBalance = (value, asset, buffer) => {
  const decimals = get(asset, 'decimals', 18);
  const assetBalance = convertRawAmountToDecimalFormat(value, decimals);

  return {
    amount: assetBalance,
    display: convertAmountToBalanceDisplay(assetBalance, asset, buffer),
  };
};

/**
 * @desc convert from amount value to display formatted string
 * @param  {BigNumber}  value
 * @param  {Object}     asset
 * @param  {Number}     buffer
 * @return {String}
 */
export const convertAmountToBalanceDisplay = (value, asset, buffer) => {
  const decimals = get(asset, 'decimals', 18);
  const display = handleSignificantDecimals(value, decimals, buffer);
  return `${display} ${get(asset, 'symbol', '')}`;
};

/**
 * @desc convert from amount to display formatted string
 * @param  {BigNumber}  value
 * @param  {Number}     buffer
 * @return {String}
 */
export const convertAmountToPercentageDisplay = (
  value,
  decimals = 2,
  buffer
) => {
  const display = handleSignificantDecimals(value, decimals, buffer);
  return `${display}%`;
};

/**
 * @desc convert from bips amount to percentage format
 * @param  {BigNumber}  value in bips
 * @param  {Number}     decimals
 * @return {String}
 */
export const convertBipsToPercentage = (value, decimals = 2) =>
  BigNumber(`${value}`)
    .shiftedBy(-2)
    .toFixed(decimals);

/**
 * @desc convert from amount value to display formatted string
 * @param  {BigNumber}  value
 * @param  {String}     nativeCurrency
 * @return {String}
 */
export const convertAmountToNativeDisplay = (value, nativeCurrency, buffer) => {
  const nativeSelected = supportedNativeCurrencies[nativeCurrency];
  const { decimals } = nativeSelected;
  const display = handleSignificantDecimals(value, decimals, buffer);
  if (nativeSelected.alignment === 'left') {
    return `${nativeSelected.symbol}${display}`;
  }
  return `${display} ${nativeSelected.currency}`;
};

/**
 * @desc convert from raw amount to decimal format
 * @param  {String|Number}  value
 * @param  {Number}     decimals
 * @return {String}
 */
export const convertRawAmountToDecimalFormat = (value, decimals = 18) =>
  BigNumber(`${value}`)
    .dividedBy(BigNumber(10).pow(decimals))
    .toFixed();

export const fromWei = number => convertRawAmountToDecimalFormat(number, 18);

/**
 * @desc Promise that will resolve after the ms interval
 * @param  {Number}  ms
 * @return {Promise}
 */
export const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
