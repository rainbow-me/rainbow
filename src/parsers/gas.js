import { get, map, zipObject } from 'lodash';
import { getMinimalTimeUnitStringForMs } from '../helpers/time';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';
import ethUnits from '../references/ethereum-units.json';
import timeUnits from '../references/time-units.json';
import { gasUtils } from '../utils';

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = (short = true) => ({
  [gasUtils.FAST]: defaultGasPriceFormat(gasUtils.FAST, '0.5', '200', short),
  [gasUtils.NORMAL]: defaultGasPriceFormat(
    gasUtils.NORMAL,
    '2.5',
    '100',
    short
  ),
  [gasUtils.SLOW]: defaultGasPriceFormat(gasUtils.SLOW, '2.5', '100', short),
});

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const parseGasPrices = (data, short = true) =>
  !data
    ? getFallbackGasPrices()
    : {
        [gasUtils.FAST]: defaultGasPriceFormat(
          gasUtils.FAST,
          data.fastestWait,
          data.fastest,
          short
        ),
        [gasUtils.NORMAL]: defaultGasPriceFormat(
          gasUtils.NORMAL,
          data.fastWait,
          data.fast,
          short
        ),
        [gasUtils.SLOW]: defaultGasPriceFormat(
          gasUtils.SLOW,
          data.avgWait,
          data.average,
          short
        ),
      };

const defaultGasPriceFormat = (option, timeWait, value) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const gweiAmount = divide(value, 10);
  const weiAmount = multiply(gweiAmount, ethUnits.gwei);
  return {
    estimatedTime: {
      amount: timeAmount,
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    option,
    value: {
      amount: weiAmount,
      display: `${gweiAmount} Gwei`,
    },
  };
};

/**
 * @desc parse ether gas prices with updated gas limit
 * @param {Object} data
 * @param {Object} prices
 * @param {Number} gasLimit
 */
export const parseTxFees = (gasPrices, priceUnit, gasLimit, nativeCurrency) => {
  const txFees = map(gasUtils.GasSpeedOrder, speed => {
    const gasPrice = get(gasPrices, `${speed}.value.amount`);
    return {
      txFee: getTxFee(gasPrice, gasLimit, priceUnit, nativeCurrency),
    };
  });
  return zipObject(gasUtils.GasSpeedOrder, txFees);
};

const getTxFee = (gasPrice, gasLimit, priceUnit, nativeCurrency) => {
  const amount = multiply(gasPrice, gasLimit);
  return {
    native: {
      value: convertRawAmountToNativeDisplay(
        amount,
        18,
        priceUnit,
        nativeCurrency
      ),
    },
    value: {
      amount,
      display: convertRawAmountToBalance(amount, {
        decimals: 18,
        symbol: 'ETH',
      }),
    },
  };
};
