import BigNumber from 'bignumber.js';
import { map, zipObject } from 'lodash';
import { gasUtils } from '../utils';
import {
  ConfirmationTimeByPriorityFee,
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  GasPricesAPIData,
  LegacyGasFeeParams,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  MaxPriorityFeeSuggestions,
  Numberish,
  RainbowMeteorologyData,
  SelectedGasFee,
} from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { getMinimalTimeUnitStringForMs } from '@rainbow-me/helpers/time';
import { ethUnits, timeUnits } from '@rainbow-me/references';
import {
  add,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThan,
  multiply,
  toFixedDecimals,
} from '@rainbow-me/utilities';

type BigNumberish = number | string | BigNumber;

const { CUSTOM, FAST, GasSpeedOrder, NORMAL, URGENT } = gasUtils;

const parseOtherL2GasPrices = (data: GasPricesAPIData) => ({
  [FAST]: defaultGasPriceFormat(FAST, data.avgWait, data.average),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.avgWait, data.average),
  [URGENT]: defaultGasPriceFormat(URGENT, data.fastWait, data.fast),
});

const parseGasDataConfirmationTime = (
  maxBaseFee: string,
  maxPriorityFee: string,
  confirmationTimeByPriorityFee: ConfirmationTimeByPriorityFee,
  suggestedMaxBaseFee: string
) => {
  const maxPriorityFeeGwei = Number(weiToGwei(maxPriorityFee));
  const moreThanUrgentTime = Number(
    weiToGwei(confirmationTimeByPriorityFee[15])
  );
  const urgentTime = Number(weiToGwei(confirmationTimeByPriorityFee[30]));
  const fastTime = Number(weiToGwei(confirmationTimeByPriorityFee[45]));
  const normalTime = Number(weiToGwei(confirmationTimeByPriorityFee[60]));

  const maxBaseFeeGwei = Number(weiToGwei(maxBaseFee));
  const suggestedMaxBaseFeeGwei = Number(weiToGwei(suggestedMaxBaseFee));

  let timeAmount = 15;

  // 95% match 1st block, for 1 * suggested max base fee
  // 95% match 3rd block, for 0.95 * suggested max base fee
  // 95% match 4th block, for 0.9 * suggested max base fee
  // less than that we show warnings
  if (suggestedMaxBaseFeeGwei >= maxBaseFeeGwei) {
    timeAmount += 0;
  } else if (
    suggestedMaxBaseFeeGwei < maxBaseFeeGwei &&
    suggestedMaxBaseFeeGwei >= maxBaseFeeGwei * 0.95
  ) {
    timeAmount = 15;
  } else if (
    suggestedMaxBaseFeeGwei < maxBaseFeeGwei * 0.85 &&
    suggestedMaxBaseFeeGwei >= maxBaseFeeGwei * 0.9
  ) {
    timeAmount = 30;
  } else {
    timeAmount = 45;
  }
  if (maxPriorityFeeGwei > moreThanUrgentTime) {
    timeAmount += 0;
  } else if (
    maxPriorityFeeGwei < moreThanUrgentTime &&
    maxPriorityFeeGwei >= urgentTime
  ) {
    timeAmount += 30;
  } else if (
    maxPriorityFeeGwei < urgentTime &&
    maxPriorityFeeGwei >= fastTime
  ) {
    timeAmount += 45;
  } else if (
    maxPriorityFeeGwei < fastTime &&
    maxPriorityFeeGwei >= normalTime
  ) {
    timeAmount += 60;
  } else if (maxPriorityFeeGwei < normalTime) timeAmount += 90;

  return {
    amount: timeAmount,
    display: getMinimalTimeUnitStringForMs(
      multiply(timeAmount, timeUnits.ms.second)
    ),
  };
};

export const parseRainbowMeteorologyData = (
  rainbowMeterologyData: RainbowMeteorologyData
): {
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  baseFeePerGas: GasFeeParam;
  baseFeeTrend: number;
  currentBaseFee: GasFeeParam;
  confirmationTimeByPriorityFee: ConfirmationTimeByPriorityFee;
} => {
  const {
    baseFeeSuggestion,
    baseFeeTrend,
    maxPriorityFeeSuggestions,
    confirmationTimeByPriorityFee,
    currentBaseFee,
  } = rainbowMeterologyData.data;
  const parsedFees: GasFeeParamsBySpeed = {};
  const parsedCurrentBaseFee = parseGasFeeParam(currentBaseFee);
  const parsedBaseFeeSuggestion = parseGasFeeParam(baseFeeSuggestion);

  Object.keys(maxPriorityFeeSuggestions).forEach(speed => {
    const maxPriorityFee =
      maxPriorityFeeSuggestions[speed as keyof MaxPriorityFeeSuggestions];
    // next version of the package will send only 2 decimals
    const cleanMaxPriorityFee = gweiToWei(
      new BigNumber(weiToGwei(maxPriorityFee)).toFixed(2)
    );
    parsedFees[speed] = {
      estimatedTime: parseGasDataConfirmationTime(
        currentBaseFee,
        cleanMaxPriorityFee,
        confirmationTimeByPriorityFee,
        baseFeeSuggestion
      ),
      maxFeePerGas: parsedBaseFeeSuggestion,
      maxPriorityFeePerGas: parseGasFeeParam(cleanMaxPriorityFee),
      option: speed,
    };
  });

  parsedFees[CUSTOM] = {} as GasFeeParams;

  return {
    baseFeePerGas: parsedBaseFeeSuggestion,
    baseFeeTrend,
    confirmationTimeByPriorityFee,
    currentBaseFee: parsedCurrentBaseFee,
    gasFeeParamsBySpeed: parsedFees,
  };
};

const parseGasPricesPolygonGasStation = (data: GasPricesAPIData) => {
  const polygonGasPriceBumpFactor = 1.05;
  return {
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
 * @param {String} network
 */
export const parseL2GasPrices = (
  data: GasPricesAPIData,
  network: Network
): LegacyGasFeeParamsBySpeed | null => {
  if (!data) return null;
  switch (network) {
    case Network.polygon:
      return parseGasPricesPolygonGasStation(data);
    case Network.arbitrum:
    case Network.optimism:
    default:
      return parseOtherL2GasPrices(data);
  }
};

export const defaultGasPriceFormat = (
  option: string,
  timeWait: Numberish,
  value: Numberish
): LegacyGasFeeParams => {
  const timeAmount = multiply(timeWait, timeUnits.ms.minute);
  const weiAmount = multiply(value, ethUnits.gwei);
  return {
    estimatedTime: {
      amount: Number(timeAmount),
      display: getMinimalTimeUnitStringForMs(timeAmount),
    },
    gasPrice: {
      amount: weiAmount,
      display: `${toFixedDecimals(value, 0)} Gwei`,
      gwei: toFixedDecimals(value, 0),
    },
    option,
  };
};

/**
 * Transform wei gas value into a `GasFeeParam` object
 * @param weiAmount - Gas value in wei unit
 * @returns
 */
export const parseGasFeeParam = (weiAmount: string): GasFeeParam => {
  return {
    amount: weiAmount,
    display: `${parseInt(weiToGwei(weiAmount), 10)} Gwei`,
    gwei: weiToGwei(weiAmount),
  };
};

/**
 * Transform EIP1559 params into a `GasFeeParams` object
 * @param option - Speed option
 * @param currentBaseFee - Block base fee
 * @param maxFeePerGas - `maxFeePerGas` value in gwei unit
 * @param maxPriorityFeePerGas - `maxPriorityFeePerGas` value in gwei unit
 * @param confirmationTimeByPriorityFee - ConfirmationTimeByPriorityFee object
 * @returns GasFeeParams
 */
export const defaultGasParamsFormat = (
  option: string,
  currentBaseFee: string,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  confirmationTimeByPriorityFee: ConfirmationTimeByPriorityFee
): GasFeeParams => {
  const time = parseGasDataConfirmationTime(
    currentBaseFee,
    maxPriorityFeePerGas,
    confirmationTimeByPriorityFee,
    maxFeePerGas
  );
  return {
    estimatedTime: time,
    maxFeePerGas: parseGasFeeParam(maxFeePerGas),
    maxPriorityFeePerGas: parseGasFeeParam(maxPriorityFeePerGas),
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
  nativeCurrency: string,
  l1GasFeeOptimism: BigNumber | null = null
): LegacyGasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed => {
    const gasPrice = legacyGasFees?.[speed]?.gasPrice?.amount || 0;
    const estimatedFee = getTxFee(
      gasPrice,
      gasLimit,
      priceUnit,
      nativeCurrency,
      l1GasFeeOptimism
    );
    return {
      estimatedFee,
    };
  });
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

export const parseGasFees = (
  gasFeeParams: GasFeeParams,
  baseFeePerGas: GasFeeParam,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
) => {
  const { maxPriorityFeePerGas, maxFeePerGas } = gasFeeParams || {};
  const priorityFee = maxPriorityFeePerGas?.amount || 0;
  const maxFeePerGasAmount = maxFeePerGas?.amount || 0;
  const baseFeePerGasAmount = baseFeePerGas?.amount || 0;

  // if user sets the max base fee to lower than the current base fee
  const estimatedFeePerGas = greaterThan(
    maxFeePerGasAmount,
    baseFeePerGasAmount
  )
    ? baseFeePerGasAmount
    : maxFeePerGasAmount;

  const maxFee = getTxFee(
    add(maxFeePerGasAmount, priorityFee),
    gasLimit,
    priceUnit,
    nativeCurrency
  );
  const estimatedFee = getTxFee(
    add(estimatedFeePerGas, priorityFee),
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
  baseFeePerGas: GasFeeParam,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: string
): GasFeesBySpeed => {
  const gasFeesBySpeed = map(GasSpeedOrder, speed =>
    parseGasFees(
      gasFeeParamsBySpeed[speed],
      baseFeePerGas,
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
  nativeCurrency: string,
  l1GasFeeOptimism: BigNumber | null = null
) => {
  let amount = multiply(gasPrice, gasLimit);
  if (l1GasFeeOptimism && greaterThan(l1GasFeeOptimism.toString(), '0')) {
    amount = add(amount, l1GasFeeOptimism.toString());
  }

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
    return { gasPrice: toHex(gasPrice.amount) };
  }
  const gasFeeParams = (selectedGasFee as SelectedGasFee).gasFeeParams;
  return {
    maxFeePerGas: toHex(gasFeeParams.maxFeePerGas.amount),
    maxPriorityFeePerGas: toHex(gasFeeParams.maxPriorityFeePerGas.amount),
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
