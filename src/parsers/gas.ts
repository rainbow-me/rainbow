import BigNumber from 'bignumber.js';
import zipObject from 'lodash/zipObject';
import { gasUtils } from '../utils';
import {
  BlocksToConfirmation,
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  GasPricesAPIData,
  LegacyGasFeeParams,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  LegacyTransactionGasParamAmounts,
  MaxPriorityFeeSuggestions,
  NativeCurrencyKey,
  Numberish,
  RainbowMeteorologyData,
  SelectedGasFee,
  TransactionGasParamAmounts,
} from '@/entities';
import { toHex } from '@/handlers/web3';
import { getMinimalTimeUnitStringForMs } from '@/helpers/time';
import { ethUnits, timeUnits } from '@/references';
import {
  add,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThan,
  lessThan,
  multiply,
  toFixedDecimals,
} from '@/helpers/utilities';
import { Network } from '@/networks/types';

type BigNumberish = number | string | BigNumber;

const { CUSTOM, FAST, GasSpeedOrder, NORMAL, URGENT } = gasUtils;

const getBaseFeeMultiplier = (speed: string) => {
  switch (speed) {
    case URGENT:
      return 1.1;
    case FAST:
      return 1.05;
    case NORMAL:
    default:
      return 1;
  }
};

const parseGasDataConfirmationTime = (
  maxBaseFee: string,
  maxPriorityFee: string,
  blocksToConfirmation: BlocksToConfirmation,
  secondsPerNewBlock: number
) => {
  let blocksToWaitForPriorityFee = 0;
  let blocksToWaitForBaseFee = 0;
  const { byPriorityFee, byBaseFee } = blocksToConfirmation;

  if (lessThan(maxPriorityFee, divide(byPriorityFee[4], 2))) {
    blocksToWaitForPriorityFee += 240;
  } else if (lessThan(maxPriorityFee, byPriorityFee[4])) {
    blocksToWaitForPriorityFee += 4;
  } else if (lessThan(maxPriorityFee, byPriorityFee[3])) {
    blocksToWaitForPriorityFee += 3;
  } else if (lessThan(maxPriorityFee, byPriorityFee[2])) {
    blocksToWaitForPriorityFee += 2;
  } else if (lessThan(maxPriorityFee, byPriorityFee[1])) {
    blocksToWaitForPriorityFee += 1;
  }

  if (lessThan(byBaseFee[4], maxBaseFee)) {
    blocksToWaitForBaseFee += 1;
  } else if (lessThan(byBaseFee[8], maxBaseFee)) {
    blocksToWaitForBaseFee += 4;
  } else if (lessThan(byBaseFee[40], maxBaseFee)) {
    blocksToWaitForBaseFee += 8;
  } else if (lessThan(byBaseFee[120], maxBaseFee)) {
    blocksToWaitForBaseFee += 40;
  } else if (lessThan(byBaseFee[240], maxBaseFee)) {
    blocksToWaitForBaseFee += 120;
  } else {
    blocksToWaitForBaseFee += 240;
  }

  // 1 hour as max estimate, 240 blocks
  const totalBlocksToWait =
    blocksToWaitForBaseFee +
    (blocksToWaitForBaseFee < 240 ? blocksToWaitForPriorityFee : 0);
  const timeAmount = secondsPerNewBlock * totalBlocksToWait;

  return {
    amount: timeAmount,
    display: getMinimalTimeUnitStringForMs(
      multiply(timeAmount, timeUnits.ms.second)
    ),
  };
};

export const parseRainbowMeteorologyData = (
  rainbowMeterologyData: RainbowMeteorologyData,
  network: Network
): {
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  baseFeePerGas: GasFeeParam;
  baseFeeTrend: number;
  currentBaseFee: GasFeeParam;
  blocksToConfirmation: BlocksToConfirmation;
  secondsPerNewBlock: number;
} => {
  const {
    baseFeeSuggestion,
    baseFeeTrend,
    maxPriorityFeeSuggestions,
    currentBaseFee,
    secondsPerNewBlock,
  } = rainbowMeterologyData.data;

  const blocksToConfirmation: BlocksToConfirmation = {
    byBaseFee: rainbowMeterologyData.data.blocksToConfirmationByBaseFee,
    byPriorityFee: rainbowMeterologyData.data.blocksToConfirmationByPriorityFee,
  };

  const parsedFees: GasFeeParamsBySpeed = {};
  const parsedCurrentBaseFee = parseGasFeeParam(currentBaseFee);
  const parsedBaseFeeSuggestion = parseGasFeeParam(baseFeeSuggestion);

  Object.keys(maxPriorityFeeSuggestions).forEach(speed => {
    const baseFeeMultiplier = getBaseFeeMultiplier(speed);
    const speedMaxBaseFee = multiply(baseFeeSuggestion, baseFeeMultiplier);

    const maxPriorityFee =
      maxPriorityFeeSuggestions[speed as keyof MaxPriorityFeeSuggestions];
    // next version of the package will send only 2 decimals
    const cleanMaxPriorityFee = gweiToWei(
      new BigNumber(weiToGwei(maxPriorityFee))
    );
    // clean max base fee to only parser int gwei
    const cleanMaxBaseFee = toFixedDecimals(
      gweiToWei(new BigNumber(weiToGwei(speedMaxBaseFee))),
      0
    );
    parsedFees[speed] = {
      estimatedTime: parseGasDataConfirmationTime(
        cleanMaxBaseFee,
        cleanMaxPriorityFee,
        blocksToConfirmation,
        secondsPerNewBlock
      ),
      maxBaseFee: parseGasFeeParam(cleanMaxBaseFee),
      maxPriorityFeePerGas: parseGasFeeParam(cleanMaxPriorityFee),
      option: speed,
    };
  });

  parsedFees[CUSTOM] = {} as GasFeeParams;
  return {
    baseFeePerGas: parsedBaseFeeSuggestion,
    baseFeeTrend,
    blocksToConfirmation,
    currentBaseFee: parsedCurrentBaseFee,
    gasFeeParamsBySpeed: parsedFees,
    secondsPerNewBlock,
  };
};

/**
 * @desc parse ether gas prices
 * @param {Object} data
s */
export const parseL2GasPrices = (data: GasPricesAPIData) => ({
  [FAST]: defaultGasPriceFormat(FAST, data.fastWait, data.fast),
  [NORMAL]: defaultGasPriceFormat(NORMAL, data.normalWait, data.normal),
  [URGENT]: defaultGasPriceFormat(URGENT, data.urgentWait, data.urgent),
});

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
 * @param maxBaseFee
 * @param maxPriorityFeePerGas - `maxPriorityFeePerGas` value in gwei unit
 * @param blocksToConfirmation - BlocksToConfirmation object
 * @returns GasFeeParams
 */
export const defaultGasParamsFormat = (
  option: string,
  maxBaseFee: string,
  maxPriorityFeePerGas: string,
  blocksToConfirmation: BlocksToConfirmation,
  secondsPerNewBlock: number
): GasFeeParams => {
  const time = parseGasDataConfirmationTime(
    maxBaseFee,
    maxPriorityFeePerGas,
    blocksToConfirmation,
    secondsPerNewBlock
  );
  return {
    estimatedTime: time,
    maxBaseFee: parseGasFeeParam(maxBaseFee),
    maxPriorityFeePerGas: parseGasFeeParam(maxPriorityFeePerGas),
    option,
  };
};

/**
 * @desc parse ether gas prices with updated gas limit
 * @param legacyGasFees
 * @param {Number} gasLimit
 * @param priceUnit
 * @param nativeCurrency
 * @param l1GasFeeOptimism
 */
export const parseLegacyGasFeesBySpeed = (
  legacyGasFees: LegacyGasFeeParamsBySpeed,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: NativeCurrencyKey,
  l1GasFeeOptimism: BigNumber | null = null
): LegacyGasFeesBySpeed => {
  const gasFeesBySpeed = GasSpeedOrder.map(speed => {
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
  nativeCurrency: NativeCurrencyKey,
  l1GasFeeOptimism: BigNumber | null = null
) => {
  const { maxPriorityFeePerGas, maxBaseFee } = gasFeeParams || {};
  const priorityFee = maxPriorityFeePerGas?.amount || 0;
  const maxFeePerGasAmount = maxBaseFee?.amount || 0;
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
    nativeCurrency,
    l1GasFeeOptimism
  );
  const estimatedFee = getTxFee(
    add(estimatedFeePerGas, priorityFee),
    gasLimit,
    priceUnit,
    nativeCurrency,
    l1GasFeeOptimism
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
  nativeCurrency: NativeCurrencyKey,
  l1GasFeeOptimism: BigNumber | null = null
): GasFeesBySpeed => {
  const gasFeesBySpeed = GasSpeedOrder.map(speed =>
    parseGasFees(
      gasFeeParamsBySpeed[speed],
      baseFeePerGas,
      gasLimit,
      priceUnit,
      nativeCurrency,
      l1GasFeeOptimism
    )
  );
  return zipObject(GasSpeedOrder, gasFeesBySpeed);
};

const getTxFee = (
  gasPrice: BigNumberish,
  gasLimit: BigNumberish,
  priceUnit: BigNumberish,
  nativeCurrency: NativeCurrencyKey,
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
): TransactionGasParamAmounts | LegacyTransactionGasParamAmounts => {
  const legacyGasFeeParams = (selectedGasFee as LegacySelectedGasFee)
    .gasFeeParams;
  const gasPrice = legacyGasFeeParams?.gasPrice;
  if (gasPrice) {
    return { gasPrice: toHex(gasPrice.amount) };
  }
  const gasFeeParams = (selectedGasFee as SelectedGasFee).gasFeeParams;
  return {
    maxFeePerGas: toHex(
      add(
        gasFeeParams.maxBaseFee.amount,
        gasFeeParams.maxPriorityFeePerGas.amount
      )
    ),
    maxPriorityFeePerGas: toHex(gasFeeParams.maxPriorityFeePerGas.amount),
  };
};

export const parseGasParamAmounts = (
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee
): TransactionGasParamAmounts | LegacyTransactionGasParamAmounts => {
  const legacyGasFeeParams = (selectedGasFee as LegacySelectedGasFee)
    .gasFeeParams;
  const gasPrice = legacyGasFeeParams?.gasPrice;
  if (gasPrice) {
    return { gasPrice: gasPrice.amount };
  }
  const gasFeeParams = (selectedGasFee as SelectedGasFee).gasFeeParams;
  return {
    maxFeePerGas: add(
      gasFeeParams.maxBaseFee.amount,
      gasFeeParams.maxPriorityFeePerGas.amount
    ),
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
