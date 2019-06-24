import timeUnits from '../references/time-units.json';
import ethUnits from '../references/ethereum-units.json';
import { getTimeString } from '../helpers/time';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Object} prices
 * @param {Number} gasLimit
 */
export const parseGasPrices = (data, priceUnit, gasLimit, nativeCurrency, short) => {
  const gasPrices = {
    average: null,
    fast: null,
    slow: null,
  };
  if (!data) {
    gasPrices.fast = defaultGasPriceFormat('fast', '30000', '5000000000', '5 Gwei', short);
    gasPrices.average = defaultGasPriceFormat('average', '360000', '2000000000', '2 Gwei', short);
    gasPrices.slow = defaultGasPriceFormat('slow', '1800000', '1000000000', '1 Gwei', short);
  } else {
    const fastTimeAmount = multiply(data.fastWait, timeUnits.ms.minute);
    const fastValueAmount = divide(data.fast, 10);
    gasPrices.fast = defaultGasPriceFormat(
      'fast',
      fastTimeAmount,
      multiply(fastValueAmount, ethUnits.gwei),
      `${fastValueAmount} Gwei`,
      short,
    );

    const avgTimeAmount = multiply(data.avgWait, timeUnits.ms.minute);
    const avgValueAmount = divide(data.average, 10);
    gasPrices.average = defaultGasPriceFormat(
      'average',
      avgTimeAmount,
      multiply(avgValueAmount, ethUnits.gwei),
      `${avgValueAmount} Gwei`,
      short,
    );

    const slowTimeAmount = multiply(data.safeLowWait, timeUnits.ms.minute);
    const slowValueAmount = divide(data.safeLow, 10);
    gasPrices.slow = defaultGasPriceFormat(
      'slow',
      slowTimeAmount,
      multiply(slowValueAmount, ethUnits.gwei),
      `${slowValueAmount} Gwei`,
      short,
    );
  }
  return parseGasPricesTxFee(gasPrices, priceUnit, gasLimit, nativeCurrency);
};

const defaultGasPriceFormat = (option, timeAmount, valueAmount, valueDisplay, short) => ({
  estimatedTime: {
    amount: timeAmount,
    display: getTimeString(timeAmount, 'ms', short),
  },
  option,
  value: {
    amount: valueAmount,
    display: valueDisplay,
  },
});

/**
 * @desc parse ether gas prices with updated gas limit
 * @param {Object} data
 * @param {Object} prices
 * @param {Number} gasLimit
 */
export const parseGasPricesTxFee = (gasPrices, priceUnit, gasLimit, nativeCurrency) => {
  gasPrices.fast.txFee = getTxFee(gasPrices.fast.value.amount, gasLimit);
  gasPrices.average.txFee = getTxFee(gasPrices.average.value.amount, gasLimit);
  gasPrices.slow.txFee = getTxFee(gasPrices.slow.value.amount, gasLimit);
  return convertGasPricesToNative(priceUnit, gasPrices, nativeCurrency);
};

const getTxFee = (gasPrice, gasLimit) => {
  const amount = multiply(gasPrice, gasLimit);
  return {
    native: null,
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

const convertGasPricesToNative = (priceUnit, gasPrices, nativeCurrency) => {
  const nativeGases = { ...gasPrices };
  nativeGases.fast.txFee.native = getNativeGasPrice(priceUnit, gasPrices.fast.txFee.value.amount, nativeCurrency);
  nativeGases.average.txFee.native = getNativeGasPrice(priceUnit, gasPrices.average.txFee.value.amount, nativeCurrency);
  nativeGases.slow.txFee.native = getNativeGasPrice(priceUnit, gasPrices.slow.txFee.value.amount, nativeCurrency);
  return nativeGases;
};

const getNativeGasPrice = (priceUnit, feeAmount, nativeCurrency) => {
  const nativeDisplay = convertRawAmountToNativeDisplay(
    feeAmount,
    18,
    priceUnit,
    nativeCurrency,
  );
  return {
    value: nativeDisplay,
  };
};
