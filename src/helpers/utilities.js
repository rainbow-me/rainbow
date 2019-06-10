import BigNumber from 'bignumber.js';
import {
  multiply,
  supportedNativeCurrencies,
} from '@rainbow-me/rainbow-common';

/**
 * @desc handle signficant decimals in display format
 * @param  {String|Number}   value
 * @param  {Number}   decimals
 * @param  {Number}   buffer
 * @return {String}
 */
export const handleSignificantDecimals = (value, decimals, buffer) => {
  const result = significantDecimals(value, decimals, buffer);
  return BigNumber(`${result}`).dp() <= 2
    ? BigNumber(`${result}`).toFormat(2)
    : BigNumber(`${result}`).toFormat();
};

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
export const smallerThan = (numberOne, numberTwo) =>
  BigNumber(`${numberOne}`).comparedTo(BigNumber(`${numberTwo}`)) === -1;

/**
 * @desc handle signficant decimals
 * @param  {String|Number}   value
 * @param  {Number}   decimals
 * @param  {Number}   buffer
 * @return {String}
 */
export const significantDecimals = (value, decimals, buffer) => {
  if (
    !BigNumber(`${decimals}`).isInteger() ||
    (buffer && !BigNumber(`${buffer}`).isInteger())
  )
    return null;
  buffer = buffer ? convertStringToNumber(buffer) : 3;
  decimals = convertStringToNumber(decimals);
  if (smallerThan(BigNumber(`${value}`).abs(), 1)) {
    decimals =
      BigNumber(`${value}`)
        .toString()
        .slice(2)
        .slice('')
        .search(/[^0]/g) + buffer;
    decimals = decimals < 8 ? decimals : 8;
  } else {
    decimals = decimals < buffer ? decimals : buffer;
  }
  let result = BigNumber(`${value}`).toFixed(decimals);
  result = BigNumber(`${result}`).toString();
  return result;
};

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
  const nativeBalanceRaw = multiply(amount, priceUnit);
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
    assetDecimals,
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
  const decimals = asset.decimals || 18;
  const assetBalance = convertRawAmountToDecimalFormat(
    value,
    decimals,
  );
  const display = handleSignificantDecimals(assetBalance, decimals, buffer);
  return {
    amount: assetBalance,
    display: `${display} ${asset.symbol}`,
  }
};

/**
 * @desc convert from amount to display formatted string
 * @param  {BigNumber}  value
 * @param  {Number}     buffer
 * @return {String}
 */
export const convertAmountToPercentageDisplay = (value, buffer) => {
  const display = handleSignificantDecimals(value, 2, buffer);
  return `${display}%`;
};

/**
 * @desc convert from amount value to display formatted string
 * @param  {BigNumber}  value
 * @param  {String}     nativeCurrency
 * @return {String}
 */
export const convertAmountToNativeDisplay = (value, nativeCurrency, buffer) => {
  const nativeSelected = supportedNativeCurrencies[nativeCurrency];
  const decimals = nativeSelected.decimals;
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
export const convertRawAmountToDecimalFormat = (value, decimals) => {
  return BigNumber(`${value}`)
    .dividedBy(BigNumber(10).pow(decimals))
    .toString();
};

/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseText = (text = '', maxLength = 9999) => {
  if (text.length <= maxLength) return text;
  const _maxLength = maxLength - 3;
  let ellipse = false;
  let currentLength = 0;
  const result = `${text
    .split(' ')
    .filter(word => {
      currentLength += word.length;
      if (ellipse || currentLength >= _maxLength) {
        ellipse = true;
        return false;
      }
      return true;
    })
    .join(' ')}...`;
  return result;
};

/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseAddress = (text = '') => {
  const addressArr = text.split('');
  const firstFour = text.split('', 4).join('');
  const lastFour = addressArr
    .reverse()
    .join('')
    .split('', 4)
    .reverse()
    .join('');
  const result = `${firstFour}...${lastFour}`;
  return result;
};
