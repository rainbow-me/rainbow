import { BigNumberish, ethers } from 'ethers';
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
  MaxPriorityFeeSuggestions,
  Numberish,
  RainbowMeteorologyData,
  SelectedGasFee,
} from '@rainbow-me/entities';
import { isHexString, toHex } from '@rainbow-me/handlers/web3';
import { getMinimalTimeUnitStringForMs } from '@rainbow-me/helpers/time';
import {
  ethUnits,
  supportedNativeCurrencies,
  timeUnits,
} from '@rainbow-me/references';
import {
  add,
  convertHexToString,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThan,
  lessThan,
  multiply,
  toFixedDecimals,
} from '@rainbow-me/utilities';

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
  maxBaseFee: number,
  maxPriorityFee: number,
  blocksToConfirmation: BlocksToConfirmation
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
  let timeAmount = 15 * totalBlocksToWait;

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
  blocksToConfirmation: BlocksToConfirmation;
} => {
  const {
    baseFeeSuggestion,
    baseFeeTrend,
    maxPriorityFeeSuggestions,
    currentBaseFee,
  } = rainbowMeterologyData.data;

  const blocksToConfirmation: BlocksToConfirmation = {
    byBaseFee: rainbowMeterologyData.data.blocksToConfirmationByBaseFee,
    byPriorityFee: rainbowMeterologyData.data.blocksToConfirmationByPriorityFee,
  };

  const parsedFees: GasFeeParamsBySpeed = {};
  const parsedCurrentBaseFee = parseGasFeeParam(parseFloat(currentBaseFee));
  const parsedBaseFeeSuggestion = parseGasFeeParam(
    parseFloat(baseFeeSuggestion)
  );

  Object.keys(maxPriorityFeeSuggestions).forEach(speed => {
    const baseFeeMultiplier = getBaseFeeMultiplier(speed);
    const speedMaxBaseFee = toFixedDecimals(
      multiply(baseFeeSuggestion, baseFeeMultiplier),
      0
    );
    const maxPriorityFee =
      maxPriorityFeeSuggestions[speed as keyof MaxPriorityFeeSuggestions];
    // next version of the package will send only 2 decimals
    const cleanMaxPriorityFee = numberGweiToWei(
      Number(weiToGwei(maxPriorityFee)).toFixed(2)
    );
    // clean max base fee to only parser int gwei
    const cleanMaxBaseFee = Number(speedMaxBaseFee);
    parsedFees[speed] = {
      estimatedTime: parseGasDataConfirmationTime(
        cleanMaxBaseFee,
        cleanMaxPriorityFee,
        blocksToConfirmation
      ),
      maxFeePerGas: parseGasFeeParam(cleanMaxBaseFee),
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
export const parseGasFeeParam = (weiAmount: number): GasFeeParam => {
  return {
    amount: weiAmount,
    display: `${parseInt(weiToGwei(weiAmount), 10)} Gwei`,
    gwei: weiToGwei(weiAmount),
  };
};

/**
 * Transform EIP1559 params into a `GasFeeParams` object
 * @param option - Speed option
 * @param maxFeePerGas - `maxFeePerGas` value in gwei unit
 * @param maxPriorityFeePerGas - `maxPriorityFeePerGas` value in gwei unit
 * @param blocksToConfirmation - BlocksToConfirmation object
 * @returns GasFeeParams
 */
export const defaultGasParamsFormat = (
  option: string,
  maxFeePerGas: number,
  maxPriorityFeePerGas: number,
  blocksToConfirmation: BlocksToConfirmation
): GasFeeParams => {
  const time = parseGasDataConfirmationTime(
    maxFeePerGas,
    maxPriorityFeePerGas,
    blocksToConfirmation
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
  nativeCurrency: keyof typeof supportedNativeCurrencies,
  l1GasFeeOptimism: BigNumberish | null = null
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
  nativeCurrency: keyof typeof supportedNativeCurrencies
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
  nativeCurrency: keyof typeof supportedNativeCurrencies
): GasFeesBySpeed => {
  const gasFeesBySpeed = GasSpeedOrder.map(speed =>
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
  nativeCurrency: keyof typeof supportedNativeCurrencies,
  l1GasFeeOptimism: BigNumberish | null = null
) => {
  const normalizedGasLimit = isHexString(gasLimit.toString())
    ? convertHexToString(gasLimit)
    : gasLimit;

  let amount: number = multiply(
    gasPrice.toString(),
    normalizedGasLimit.toString()
  );
  if (l1GasFeeOptimism && greaterThan(l1GasFeeOptimism.toString(), '0')) {
    amount = add(amount, l1GasFeeOptimism.toString());
  }

  return {
    native: {
      value: convertRawAmountToNativeDisplay(
        amount,
        18,
        priceUnit.toString(),
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

const cleanUpNotSafeValues = (value: string, dec: number) => {
  const values = value.split('.');
  if (!values[1] || values[1].length <= dec) {
    return value;
  }
  return value[0] + value[1].substring(0, dec);
};

export const gweiToWei = (gweiAmount: BigNumberish) => {
  return ethers.utils
    .parseUnits(cleanUpNotSafeValues(gweiAmount.toString(), 9), 'gwei')
    .toString();
};

export const numberGweiToWei = (gweiAmount: BigNumberish) => {
  return ethers.utils
    .parseUnits(cleanUpNotSafeValues(gweiAmount.toString(), 9), 'gwei')
    .toNumber();
};

export const weiToGwei = (weiAmount: BigNumberish) => {
  return Math.round(
    Number(ethers.utils.formatUnits(weiAmount.toString(), 'gwei'))
  ).toString();
};
