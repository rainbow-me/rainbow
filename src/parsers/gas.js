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

const { CUSTOM, FAST, NORMAL, SLOW, GasSpeedOrder } = gasUtils;

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = (short = true) => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, '0.5', '200', short),
  [NORMAL]: defaultGasPriceFormat(NORMAL, '2.5', '100', short),
  [SLOW]: defaultGasPriceFormat(SLOW, '2.5', '100', short),
});

const parseGasPricesEtherscan = data => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, data.fastWait, data.fast, true),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.avgWait, data.average, true),
  [SLOW]: defaultGasPriceFormat(SLOW, data.safeLowWait, data.safeLow, true),
});

const parseGasPricesEthGasStation = data => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(
    FAST,
    data.fastestWait,
    Number(data.fastest) / 10,
    true
  ),
  [NORMAL]: defaultGasPriceFormat(
    NORMAL,
    data.fastWait,
    Number(data.fast) / 10,
    true
  ),
  [SLOW]: defaultGasPriceFormat(
    SLOW,
    data.avgWait,
    Number(data.average) / 10,
    true
  ),
});
const parseGasPricesMaticGasStation = data => {
  const maticGasPriceBumpFactor = 1.15;
  return {
    [CUSTOM]: null,
    [FAST]: defaultGasPriceFormat(
      FAST,
      0.2,
      Math.ceil((Number(data.fastest) / 10) * maticGasPriceBumpFactor),
      true
    ),
    [NORMAL]: defaultGasPriceFormat(
      NORMAL,
      0.5,
      Math.ceil((Number(data.fast) / 10) * maticGasPriceBumpFactor),
      true
    ),
    [SLOW]: defaultGasPriceFormat(
      SLOW,
      1,
      Math.ceil((Number(data.average) / 10) * maticGasPriceBumpFactor) / 10,
      true
    ),
  };
};

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {String} source
 */
export const parseGasPrices = (
  data,
  source = gasUtils.GAS_PRICE_SOURCES.ETHERSCAN
) => {
  if (!data) return getFallbackGasPrices();
  switch (source) {
    case gasUtils.GAS_PRICE_SOURCES.ETH_GAS_STATION:
      return parseGasPricesEthGasStation(data);
    case gasUtils.GAS_PRICE_SOURCES.MATIC_GAS_STATION:
      return parseGasPricesMaticGasStation(data);
    default:
      return parseGasPricesEtherscan(data);
  }
};

export const defaultGasPriceFormat = (option, timeWait, value) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const weiAmount = multiply(value, ethUnits.gwei);
  return {
    estimatedTime: {
      amount: timeAmount,
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    option,
    value: {
      amount: Math.round(weiAmount),
      display: `${parseInt(value, 10)} Gwei`,
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
  const txFees = map(GasSpeedOrder, speed => {
    const gasPrice = get(gasPrices, `${speed}.value.amount`);
    const txFee = getTxFee(gasPrice, gasLimit, priceUnit, nativeCurrency);
    return {
      txFee,
    };
  });
  return zipObject(GasSpeedOrder, txFees);
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

export const gweiToWei = gweiAmount => {
  const weiAmount = multiply(gweiAmount, ethUnits.gwei);
  return weiAmount;
};

export const weiToGwei = weiAmount => {
  const gweiAmount = divide(weiAmount, ethUnits.gwei);
  return gweiAmount;
};
