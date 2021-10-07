import BigNumber from 'bignumber.js';
import { map, zipObject } from 'lodash';
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
import {
  GasFeeParamsBySpeed,
  GasFeesBlockNativeData,
  GasFeesBySpeed,
  GasPricesAPIData,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  Numberish,
} from '@rainbow-me/entities';

type BigNumberish = number | string | BigNumber;

const { CUSTOM, FAST, NORMAL, SLOW, GasSpeedOrder, GAS_CONFIDENCE } = gasUtils;

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = () => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, '0.5', '200'),
  [NORMAL]: defaultGasPriceFormat(NORMAL, '2.5', '100'),
  [SLOW]: defaultGasPriceFormat(SLOW, '2.5', '100'),
});

const parseGasPricesEtherscan = (data: GasPricesAPIData) => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, data.fastWait, data.fast),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.avgWait, data.average),
  [SLOW]: defaultGasPriceFormat(SLOW, data.safeLowWait, data.safeLow),
});

export const parseEIP1559GasData = (
  data: GasFeesBlockNativeData
): GasFeeParamsBySpeed => {
  const { baseFeePerGas, estimatedPrices } = data?.blockPrices?.[0];
  // temp multiplier
  const baseFee = baseFeePerGas * 1.5;
  const parsedFees: GasFeeParamsBySpeed = {};
  estimatedPrices.forEach(({ confidence, maxPriorityFeePerGas }) => {
    const option: string = GAS_CONFIDENCE[confidence];
    parsedFees[option] = defaultGasParamsFormat(
      option,
      '0', // time
      baseFeePerGas,
      baseFee,
      maxPriorityFeePerGas
    );
  });

  return parsedFees;
};

const parseGasPricesEthGasStation = (data: GasPricesAPIData) => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(
    FAST,
    data.fastestWait,
    Number(data.fastest) / 10
  ),
  [NORMAL]: defaultGasPriceFormat(
    NORMAL,
    data.fastWait,
    Number(data.fast) / 10
  ),
  [SLOW]: defaultGasPriceFormat(SLOW, data.avgWait, Number(data.average) / 10),
});
const parseGasPricesMaticGasStation = (data: GasPricesAPIData) => {
  const maticGasPriceBumpFactor = 1.15;
  return {
    [CUSTOM]: null,
    [FAST]: defaultGasPriceFormat(
      FAST,
      0.2,
      Math.ceil((Number(data.fastest) / 10) * maticGasPriceBumpFactor)
    ),
    [NORMAL]: defaultGasPriceFormat(
      NORMAL,
      0.5,
      Math.ceil((Number(data.fast) / 10) * maticGasPriceBumpFactor)
    ),
    [SLOW]: defaultGasPriceFormat(
      SLOW,
      1,
      Math.ceil((Number(data.average) / 10) * maticGasPriceBumpFactor) / 10
    ),
  };
};

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {String} source
 */
export const parseGasPrices = (
  data: GasPricesAPIData,
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

export const defaultGasPriceFormat = (
  option: string,
  timeWait: Numberish,
  value: Numberish
) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const weiAmount = multiply(value, ethUnits.gwei);
  return {
    estimatedTime: {
      amount: timeAmount,
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    gasPrice: {
      amount: Math.round(Number(weiAmount)),
      display: `${parseInt(value.toString(), 10)} Gwei`,
    },
    option,
  };
};

export const defaultGasParamsFormat = (
  option: string,
  timeWait: Numberish,
  baseFeePerGas: number,
  maxFeePerGas: number,
  priorityFeePerGas: number
) => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const baseFeePerGasWeiAmount = Number(multiply(baseFeePerGas, ethUnits.gwei));
  const maxFeePerGasWeiAmount = Number(multiply(maxFeePerGas, ethUnits.gwei));
  const priorityFeePerGasWeiAmount = Number(
    multiply(priorityFeePerGas, ethUnits.gwei)
  );
  return {
    baseFeePerGas: {
      amount: Math.round(baseFeePerGasWeiAmount),
      display: `${parseInt(baseFeePerGas.toString(), 10)} Gwei`,
      gwei: Number(baseFeePerGas.toFixed(2)),
    },
    estimatedTime: {
      amount: Number(timeAmount),
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    maxFeePerGas: {
      amount: Math.round(maxFeePerGasWeiAmount),
      display: `${parseInt(maxFeePerGas.toString(), 10)} Gwei`,
      gwei: Number(maxFeePerGas.toFixed(2)),
    },
    option,
    priorityFeePerGas: {
      amount: Math.round(priorityFeePerGasWeiAmount),
      display: `${parseInt(priorityFeePerGas.toString(), 10)} Gwei`,
      gwei: Number(priorityFeePerGas.toFixed(2)),
    },
  };
};

/**
 * @desc parse ether gas prices with updated gas limit
 * @param {Object} data
 * @param {Object} prices
 * @param {Number} gasLimit
 */
export const parseLegacyGasFeesBySpeed = (
  legacyGasFees: LegacyGasFeeParamsBySpeed,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
): LegacyGasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed => {
    const gasPrice = legacyGasFees?.[speed]?.gasPrice?.amount || 0;
    const estimatedFee = getTxFee(
      gasPrice,
      gasLimit,
      priceUnit,
      nativeCurrency
    );
    return {
      estimatedFee,
    };
  });
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

export const parseGasFeesBySpeed = (
  gasFeeParamsBySpeed: GasFeeParamsBySpeed,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
): GasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed => {
    // using blocknative max fee for now
    const { priorityFeePerGas, maxFeePerGas, baseFeePerGas } =
      gasFeeParamsBySpeed?.[speed] || {};

    const priorityFee = priorityFeePerGas?.amount || 0;
    const maxFeePerGasAmount = maxFeePerGas?.amount || 0;
    const baseFeePerGasAmount = baseFeePerGas?.amount || 0;
    const maxFee = getTxFee(
      maxFeePerGasAmount + priorityFee,
      gasLimit,
      priceUnit,
      nativeCurrency
    );
    const estimatedFee = getTxFee(
      baseFeePerGasAmount + priorityFee,
      gasLimit,
      priceUnit,
      nativeCurrency
    );
    return {
      estimatedFee,
      maxFee,
    };
  });
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

const getTxFee = (
  gasPrice: BigNumberish,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
) => {
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
      }),
    },
  };
};

export const gweiToWei = (gweiAmount: BigNumberish) => {
  const weiAmount = multiply(gweiAmount, ethUnits.gwei);
  return weiAmount;
};

export const weiToGwei = (weiAmount: BigNumberish) => {
  const gweiAmount = divide(weiAmount, ethUnits.gwei);
  return gweiAmount;
};
