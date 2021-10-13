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
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBlockNativeData,
  GasFeesBySpeed,
  GasPricesAPIData,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  Numberish,
  SelectedGasFee,
} from '@rainbow-me/entities';

type BigNumberish = number | string | BigNumber;

const {
  CUSTOM,
  FAST,
  NORMAL,
  URGENT,
  GasSpeedOrder,
  GAS_CONFIDENCE,
} = gasUtils;

/**
 * @desc parse ether gas prices
 * @param {Object} data
 * @param {Boolean} short - use short format or not
 */
export const getFallbackGasPrices = () => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, '2.5', '100'),
  [NORMAL]: defaultGasPriceFormat(NORMAL, '2.5', '100'),
  [URGENT]: defaultGasPriceFormat(URGENT, '0.5', '200'),
});

const parseGasPricesEtherscan = (data: GasPricesAPIData) => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, data.avgWait, data.average),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.safeLowWait, data.safeLow),
  [URGENT]: defaultGasPriceFormat(URGENT, data.fastWait, data.fast),
});

export const parseBlockNativeGasData = (
  data: GasFeesBlockNativeData
): { gasFeeParamsBySpeed: GasFeeParamsBySpeed; baseFeePerGas: GasFeeParam } => {
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
  parsedFees[CUSTOM] = {} as GasFeeParams;
  const parsedBaseFeePerGas = parseGasFeeParam(
    Number(gweiToWei(baseFeePerGas))
  );

  return {
    baseFeePerGas: parsedBaseFeePerGas,
    gasFeeParamsBySpeed: parsedFees,
  };
};

const parseGasPricesEthGasStation = (data: GasPricesAPIData) => ({
  [CUSTOM]: null,
  [FAST]: defaultGasPriceFormat(FAST, data.fastWait, Number(data.fast) / 10),
  [NORMAL]: defaultGasPriceFormat(
    NORMAL,
    data.avgWait,
    Number(data.average) / 10
  ),
  [URGENT]: defaultGasPriceFormat(
    URGENT,
    data.fastestWait,
    Number(data.fastest) / 10
  ),
});
const parseGasPricesPolygonGasStation = (data: GasPricesAPIData) => {
  const polygonGasPriceBumpFactor = 1.05;
  return {
    [CUSTOM]: null,
    [FAST]: defaultGasPriceFormat(
      FAST,
      0.5,
      Math.ceil(Number(data.fast) * polygonGasPriceBumpFactor)
    ),
    [NORMAL]: defaultGasPriceFormat(
      NORMAL,
      1,
      Math.ceil(Number(data.average) * polygonGasPriceBumpFactor)
    ),
    [URGENT]: defaultGasPriceFormat(
      URGENT,
      0.2,
      Math.ceil(Number(data.fastest) * polygonGasPriceBumpFactor)
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
    case gasUtils.GAS_PRICE_SOURCES.POLYGON_GAS_STATION:
      return parseGasPricesPolygonGasStation(data);
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

/**
 * Transform gwei gas value into a `GasFeeParam` object
 * @param weiAmount - Gas value in wei unit
 * @returns
 */
export const parseGasFeeParam = (weiAmount: number): GasFeeParam => {
  return {
    amount: Math.round(weiAmount),
    display: `${parseInt(weiToGwei(weiAmount), 10)} Gwei`,
    gwei: Number(weiToGwei(weiAmount)),
  };
};

/**
 * Transform EIP1559 params into a `GasFeeParams` object
 * @param option - Speed option
 * @param timeWait - Time
 * @param gweiBaseFeePerGas - `baseFeePerGas` value in gwei unit
 * @param gweiMaxFeePerGas - `maxFeePerGas` value in gwei unit
 * @param gweiMaxPriorityFeePerGas - `maxPriorityFeePerGas` value in gwei unit
 * @returns GasFeeParams
 */
export const defaultGasParamsFormat = (
  option: string,
  timeWait: Numberish,
  gweiBaseFeePerGas: number,
  gweiMaxFeePerGas: number,
  gweiMaxPriorityFeePerGas: number
): GasFeeParams => {
  const weiBaseFeePerGas = Number(multiply(gweiBaseFeePerGas, ethUnits.gwei));
  const weiMaxFeePerGas = Number(multiply(gweiMaxFeePerGas, ethUnits.gwei));
  const weiMaxPriorityFeePerGas = Number(
    multiply(gweiMaxPriorityFeePerGas, ethUnits.gwei)
  );
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  return {
    baseFeePerGas: parseGasFeeParam(weiBaseFeePerGas),
    estimatedTime: {
      amount: Number(timeAmount),
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    maxFeePerGas: parseGasFeeParam(weiMaxFeePerGas),
    maxPriorityFeePerGas: parseGasFeeParam(weiMaxPriorityFeePerGas),
    option,
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

export const parseGasFees = (
  gasFeeParams: GasFeeParams,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
) => {
  const { maxPriorityFeePerGas, maxFeePerGas, baseFeePerGas } =
    gasFeeParams || {};

  const priorityFee = maxPriorityFeePerGas?.amount || 0;
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
};

export const parseGasFeesBySpeed = (
  gasFeeParamsBySpeed: GasFeeParamsBySpeed,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
): GasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed =>
    parseGasFees(
      gasFeeParamsBySpeed[speed],
      gasLimit,
      priceUnit,
      nativeCurrency
    )
  );
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

export const parseGasParamsForTransaction = (
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee
) => {
  const legacyGasFeeParams = (selectedGasFee as LegacySelectedGasFee)
    .gasFeeParams;
  const gasPrice = legacyGasFeeParams?.gasPrice;
  if (gasPrice) {
    return {
      gasPrice: gasPrice.amount,
    };
  }
  const gasFeeParams = (selectedGasFee as SelectedGasFee).gasFeeParams;
  return {
    maxFeePerGas: gasFeeParams.maxFeePerGas.amount,
    maxPriorityFeePerGas: gasFeeParams.maxPriorityFeePerGas.amount,
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
