import { getMinimalTimeUnitStringForMs } from '../helpers/time';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';
import timeUnits from '../references/time-units.json';
import ethUnits from '../references/ethereum-units.json';

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = (short = true) => ({
  average: defaultGasPriceFormat('average', '2.5', '100', short),
  fast: defaultGasPriceFormat('fast', '0.5', '200', short),
  slow: defaultGasPriceFormat('slow', '2.5', '100', short),
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
        average: defaultGasPriceFormat(
          'average',
          data.avgWait,
          data.average,
          short
        ),
        fast: defaultGasPriceFormat('fast', data.fastWait, data.fast, short),
        slow: defaultGasPriceFormat(
          'slow',
          data.safeLowWait,
          data.safeLow,
          short
        ),
      };

const defaultGasPriceFormat = (option, timeWait, value) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const valueAmount = multiply(divide(value, 10), ethUnits.gwei);

  return {
    estimatedTime: {
      amount: timeAmount,
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    option,
    value: {
      amount: valueAmount,
      display: `${valueAmount} Gwei`,
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
  const txFees = {
    average: { txFee: getTxFee(gasPrices.average.value.amount, gasLimit) },
    fast: { txFee: getTxFee(gasPrices.fast.value.amount, gasLimit) },
    slow: { txFee: getTxFee(gasPrices.slow.value.amount, gasLimit) },
  };

  return convertTxFeesToNative(priceUnit, txFees, nativeCurrency);
};

const getTxFee = (gasPrice, gasLimit) => {
  const amount = multiply(gasPrice, gasLimit);
  const display = convertRawAmountToBalance(amount, {
    decimals: 18,
    symbol: 'ETH',
  });

  return {
    native: null,
    value: { amount, display },
  };
};

const convertTxFeesToNative = (priceUnit, txFees, nativeCurrency) => {
  const nativeTxFees = { ...txFees };
  nativeTxFees.fast.txFee.native = getNativeTxFee(
    priceUnit,
    txFees.fast.txFee.value.amount,
    nativeCurrency
  );
  nativeTxFees.average.txFee.native = getNativeTxFee(
    priceUnit,
    txFees.average.txFee.value.amount,
    nativeCurrency
  );
  nativeTxFees.slow.txFee.native = getNativeTxFee(
    priceUnit,
    txFees.slow.txFee.value.amount,
    nativeCurrency
  );
  return nativeTxFees;
};

const getNativeTxFee = (priceUnit, feeAmount, nativeCurrency) => ({
  value: convertRawAmountToNativeDisplay(
    feeAmount,
    18,
    priceUnit,
    nativeCurrency
  ),
});
