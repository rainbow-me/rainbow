import {
  get,
  map,
  values,
  zipObject,
} from 'lodash';
import { getMinimalTimeUnitStringForMs } from '../helpers/time';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';
import timeUnits from '../references/time-units.json';
import ethUnits from '../references/ethereum-units.json';
import { GasSpeed } from '../utils/gas';

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = (short = true) => ({
  [GasSpeed.fast]: defaultGasPriceFormat(GasSpeed.fast, '0.5', '200', short),
  [GasSpeed.normal]: defaultGasPriceFormat(GasSpeed.normal, '2.5', '100', short),
  [GasSpeed.slow]: defaultGasPriceFormat(GasSpeed.slow, '2.5', '100', short),
});

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const parseGasPrices = (data, short = true) =>
  !data
    ? getFallbackGasPrices()
    : ({
      [GasSpeed.fast]: defaultGasPriceFormat(GasSpeed.fast, data.fastWait, data.fast, short),
      [GasSpeed.normal]: defaultGasPriceFormat(GasSpeed.normal, data.avgWait, data.average, short),
      [GasSpeed.slow]: defaultGasPriceFormat(GasSpeed.slow, data.safeLowWait, data.safeLow, short),
    })
);

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
  const gasSpeedLabels = values(GasSpeed);
  const txFees = map(gasSpeedLabels, (speed) => {
    const gasPrice = get(gasPrices, `${speed}.value.amount`);
    return {
      txFee: getTxFee(gasPrice, gasLimit, priceUnit, nativeCurrency),
    };
  });
  return zipObject(gasSpeedLabels, txFees);
};

const getTxFee = (gasPrice, gasLimit, priceUnit, nativeCurrency) => {
  const amount = multiply(gasPrice, gasLimit);
  return {
    native: {
      value: convertRawAmountToNativeDisplay(
        amount,
        18,
        priceUnit,
        nativeCurrency,
      ),
    },
    value: {
      amount,
      display: convertRawAmountToBalance(
        amount,
        {
          decimals: 18,
          symbol: 'ETH',
        },
      ),
    },
  };
};
