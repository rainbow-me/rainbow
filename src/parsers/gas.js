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

const { CUSTOM, FAST, NORMAL, SLOW, GasSpeedOrder, GAS_CONFIDENCE } = gasUtils;

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

export const parseEIP1559GasData = data => {
  const { baseFeePerGas, estimatedPrices } = data?.blockPrices?.[0];
  // temp multiplier
  const baseFee = baseFeePerGas * 1.5;
  const parsedFees = {};
  estimatedPrices.forEach(({ confidence, maxPriorityFeePerGas }) => {
    parsedFees[GAS_CONFIDENCE[confidence]] = defaultGasParamsFormat(
      GAS_CONFIDENCE[confidence],
      0, // time
      baseFeePerGas,
      baseFee,
      maxPriorityFeePerGas
    );
  });

  return parsedFees;
};

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
    gasPrice: {
      amount: Math.round(weiAmount),
      display: `${parseInt(value, 10)} Gwei`,
    },
    option,
  };
};

export const defaultGasParamsFormat = (
  option,
  timeWait,
  baseFeePerGas,
  maxFeePerGas,
  priorityFeePerGas
) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const baseFeePerGasWeiAmount = multiply(baseFeePerGas, ethUnits.gwei);
  const maxFeePerGasWeiAmount = multiply(maxFeePerGas, ethUnits.gwei);
  const priorityFeePerGasWeiAmount = multiply(priorityFeePerGas, ethUnits.gwei);
  return {
    baseFeePerGas: {
      amount: Math.round(baseFeePerGasWeiAmount),
      display: `${parseInt(baseFeePerGas, 10)} Gwei`,
      gwei: baseFeePerGas.toFixed(2),
    },
    estimatedTime: {
      amount: timeAmount,
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    maxFeePerGas: {
      amount: Math.round(maxFeePerGasWeiAmount),
      display: `${parseInt(maxFeePerGas, 10)} Gwei`,
      gwei: maxFeePerGas.toFixed(2),
    },
    option,
    priorityFeePerGas: {
      amount: Math.round(priorityFeePerGasWeiAmount),
      display: `${parseInt(priorityFeePerGas, 10)} Gwei`,
      gwei: priorityFeePerGas.toFixed(2),
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
    const gasPrice = get(gasPrices, `${speed}.gasPrice.amount`);
    const txFee = getTxFee(gasPrice, gasLimit, priceUnit, nativeCurrency);
    return {
      txFee,
    };
  });
  return zipObject(GasSpeedOrder, txFees);
};

export const parseEip1559TxFees = (
  eip1559GasPrices,
  priceUnit,
  gasLimit,
  nativeCurrency
) => {
  const txFees = map(GasSpeedOrder, speed => {
    // using blocknative max fee for now
    const priorityFee = get(
      eip1559GasPrices,
      `${speed}.priorityFeePerGas.amount`
    );

    const maxFee = get(eip1559GasPrices, `${speed}.maxFeePerGas.amount`);
    const baseFee = get(eip1559GasPrices, `${speed}.baseFeePerGas.amount`);
    const maxTxFee = getTxFee(
      maxFee + priorityFee,
      gasLimit,
      priceUnit,
      nativeCurrency
    );
    const baseTxFee = getTxFee(
      baseFee + priorityFee,
      gasLimit,
      priceUnit,
      nativeCurrency
    );
    return {
      baseTxFee,
      maxTxFee,
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
