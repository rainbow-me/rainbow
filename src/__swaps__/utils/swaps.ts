import c from 'chroma-js';
import { SharedValue, convertToRGBA, isColor } from 'react-native-reanimated';

import * as i18n from '@/languages';
import { globalColors } from '@/design-system';
import { ForegroundColor, palettes } from '@/design-system/color/palettes';
import {
  ETH_COLOR,
  ETH_COLOR_DARK,
  MAXIMUM_SIGNIFICANT_DECIMALS,
  SCRUBBER_WIDTH,
  SLIDER_WIDTH,
  STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS,
} from '@/__swaps__/screens/Swap/constants';
import { chainNameFromChainId, chainNameFromChainIdWorklet } from '@/__swaps__/utils/chains';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { isLowerCaseMatchWorklet } from '@/__swaps__/utils/strings';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { RainbowConfig } from '@/model/remoteConfig';
import { userAssetsStore } from '@/state/assets/userAssets';
import { colors } from '@/styles';
import { BigNumberish } from '@ethersproject/bignumber';
import { CrosschainQuote, ETH_ADDRESS, Quote, QuoteParams, SwapType, WRAPPED_ASSET } from '@rainbow-me/swaps';
import { swapsStore } from '../../state/swaps/swapsStore';
import { AddressOrEth, ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '../types/assets';
import { inputKeys } from '../types/swap';
import { convertAmountToRawAmount } from './numbers';
import {
  ceilWorklet,
  divWorklet,
  equalWorklet,
  floorWorklet,
  lessThanOrEqualToWorklet,
  mulWorklet,
  powWorklet,
  roundWorklet,
  toFixedWorklet,
  greaterThanOrEqualToWorklet,
  orderOfMagnitudeWorklet,
  isNumberStringWorklet,
} from '../safe-math/SafeMath';

// /---- 🎨 Color functions 🎨 ----/ //
//
export const opacity = (color: string, opacity: number): string => {
  return c(color).alpha(opacity).css();
};

export type ResponseByTheme<T> = {
  light: T;
  dark: T;
};

export const getColorValueForTheme = <T>(values: ResponseByTheme<T> | undefined, isDarkMode: boolean, useDefaults = false) => {
  if (!values) {
    return isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;
  }
  return isDarkMode ? values.dark : values.light;
};

export const getColorValueForThemeWorklet = <T>(values: ResponseByTheme<T> | undefined, isDarkMode: boolean, useDefaults = true) => {
  'worklet';

  if (!values) {
    return isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;
  }
  return isDarkMode ? values.dark : values.light;
};

export const getHighContrastColor = (color: string): ResponseByTheme<string> => {
  if (color === ETH_COLOR) {
    return {
      light: ETH_COLOR,
      dark: ETH_COLOR_DARK,
    };
  }

  let lightColor = color;
  let darkColor = color;

  const lightModeContrast = c.contrast(lightColor, globalColors.white100);
  const darkModeContrast = c.contrast(darkColor, globalColors.grey100);

  if (lightModeContrast < 2.5) {
    lightColor = c(lightColor)
      .set('hsl.s', `*${lightModeContrast < 1.5 ? 2 : 1.2}`)
      .darken(2.5 - (lightModeContrast - (lightModeContrast < 1.5 ? 0.5 : 0)))
      .hex();
  }

  if (darkModeContrast < 3) {
    darkColor = c(darkColor)
      .set('hsl.l', darkModeContrast < 1.5 ? 0.88 : 0.8)
      .set('hsl.s', `*${darkModeContrast < 1.5 ? 0.75 : 0.85}`)
      .hex();
  }

  return {
    light: lightColor,
    dark: darkColor,
  };
};

export const getMixedColor = (color1: string, color2: string, ratio: number) => {
  return c.mix(color1, color2, ratio).hex();
};

export const getTextColor = (colors: ResponseByTheme<string>): ResponseByTheme<string> => {
  const lightContrast = c.contrast(colors.light, globalColors.white100);
  const darkContrast = c.contrast(colors.dark === ETH_COLOR ? ETH_COLOR_DARK : colors.dark, globalColors.white100);

  return {
    light: lightContrast < 2 ? globalColors.grey100 : globalColors.white100,
    dark: darkContrast < 2.6 ? globalColors.grey100 : globalColors.white100,
  };
};

export const getMixedShadowColor = (color: string): ResponseByTheme<string> => {
  return {
    light: getMixedColor(color, colors.dark, 0.84),
    dark: globalColors.grey100,
  };
};

export const getTintedBackgroundColor = (colors: ResponseByTheme<string>): ResponseByTheme<string> => {
  const lightModeColorToMix = globalColors.white100;
  const darkModeColorToMix = globalColors.grey100;

  return {
    light: c.mix(colors.light, lightModeColorToMix, 0.94).saturate(-0.06).hex(),
    dark: c.mix(colors.dark === ETH_COLOR ? ETH_COLOR_DARK : colors.dark, darkModeColorToMix, 0.9875).hex(),
  };
};

//
// /---- END color functions ----/ //

// /---- 🟢 JS utils 🟢 ----/ //
//
export const clampJS = (value: number, lowerBound: number, upperBound: number) => {
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export const countDecimalPlaces = (number: number | string): number => {
  'worklet';

  const numAsString = typeof number === 'string' ? number : number.toString();

  if (numAsString.includes('.')) {
    // Return the number of digits after the decimal point, excluding trailing zeros
    return numAsString.split('.')[1].replace(/0+$/, '').length;
  }

  // If no decimal point
  return 0;
};

export const findNiceIncrement = (availableBalance: string | number | undefined) => {
  'worklet';
  if (Number(availableBalance) === 0) {
    return 0;
  }

  if (!availableBalance || !isNumberStringWorklet(availableBalance.toString()) || equalWorklet(availableBalance, 0)) {
    return 0;
  }

  // We'll use one of these factors to adjust the base increment
  // These factors are chosen to:
  // a) Produce user-friendly amounts to swap (e.g., 0.1, 0.2, 0.3, 0.4…)
  // b) Limit shifts in the number of decimal places between increments
  const niceFactors = [1, 2, 10];

  // Calculate the exact increment for 100 steps
  const exactIncrement = divWorklet(availableBalance, 100);

  // Calculate the order of magnitude of the exact increment
  const orderOfMagnitude = orderOfMagnitudeWorklet(exactIncrement);

  const baseIncrement = powWorklet(10, orderOfMagnitude);

  let adjustedIncrement = baseIncrement;

  // Find the first nice increment that ensures at least 100 steps
  for (let i = niceFactors.length - 1; i >= 0; i--) {
    const potentialIncrement = mulWorklet(baseIncrement, niceFactors[i]);
    if (lessThanOrEqualToWorklet(potentialIncrement, exactIncrement)) {
      adjustedIncrement = potentialIncrement;
      break;
    }
  }
  return adjustedIncrement;
};
//
// /---- END JS utils ----/ //

// /---- 🔵 Worklet utils 🔵 ----/ //
//
export function addCommasToNumber<T extends 0 | '0' | '0.00'>(number: string | number, fallbackValue: T = 0 as T): T | string {
  'worklet';
  if (isNaN(Number(number))) {
    return fallbackValue;
  }
  const numberString = number.toString();

  if (numberString.includes(',')) {
    return numberString;
  }

  if (greaterThanOrEqualToWorklet(number, 1000)) {
    const parts = numberString.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  } else {
    return numberString;
  }
}

export function clamp(value: number, lowerBound: number, upperBound: number) {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
}

export function stripCommas(value: string) {
  'worklet';
  return value.replace(/,/g, '');
}

export function trimTrailingZeros(value: string) {
  'worklet';
  const withTrimmedZeros = value.replace(/0+$/, '');
  return withTrimmedZeros.endsWith('.') ? withTrimmedZeros.slice(0, -1) : withTrimmedZeros;
}

export function precisionBasedOffMagnitude(amount: number | string, isStablecoin = false): number {
  'worklet';

  const magnitude = -orderOfMagnitudeWorklet(amount);
  // don't let stablecoins go beneath 2nd order
  if (magnitude < -2 && isStablecoin) {
    return -STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS;
  }
  return magnitude;
}

export function valueBasedDecimalFormatter({
  amount,
  nativePrice,
  roundingMode,
  precisionAdjustment,
  isStablecoin,
  stripSeparators = true,
}: {
  amount: number | string;
  nativePrice: number;
  roundingMode?: 'up' | 'down' | 'none';
  precisionAdjustment?: number;
  isStablecoin?: boolean;
  stripSeparators?: boolean;
}): string {
  'worklet';

  function calculateDecimalPlaces(): number {
    const fallbackDecimalPlaces = MAXIMUM_SIGNIFICANT_DECIMALS;
    if (nativePrice === 0) {
      return fallbackDecimalPlaces;
    }
    const unitsForOneCent = 0.01 / nativePrice;
    if (unitsForOneCent >= 1) {
      return isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0;
    }
    return Math.max(
      Math.ceil(Math.log10(1 / unitsForOneCent)) + (precisionAdjustment ?? 0),
      isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : 0
    );
  }

  const decimalPlaces = calculateDecimalPlaces();

  let roundedAmount;
  const factor = Math.pow(10, decimalPlaces) || 1; // Prevent division by 0

  // Apply rounding based on the specified rounding mode
  if (roundingMode === 'up') {
    roundedAmount = divWorklet(ceilWorklet(mulWorklet(amount, factor)), factor);
  } else if (roundingMode === 'down') {
    roundedAmount = divWorklet(floorWorklet(mulWorklet(amount, factor)), factor);
  } else if (roundingMode === 'none') {
    roundedAmount = toFixedWorklet(amount, decimalPlaces);
  } else {
    // Default to normal rounding if no rounding mode is specified
    roundedAmount = divWorklet(roundWorklet(mulWorklet(amount, factor)), factor);
  }

  // Format the number to add separators and trim trailing zeros
  const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
    useGrouping: !stripSeparators,
  });

  return numberFormatter.format(Number(roundedAmount));
}

export function niceIncrementFormatter({
  incrementDecimalPlaces,
  inputAssetBalance,
  inputAssetNativePrice,
  niceIncrement,
  percentageToSwap,
  sliderXPosition,
  stripSeparators,
  isStablecoin = false,
}: {
  incrementDecimalPlaces: number;
  inputAssetBalance: number | string;
  inputAssetNativePrice: number;
  niceIncrement: number | string;
  percentageToSwap: number;
  sliderXPosition: number;
  stripSeparators?: boolean;
  isStablecoin?: boolean;
}) {
  'worklet';

  if (percentageToSwap === 0 || equalWorklet(niceIncrement, 0)) return '0';
  if (percentageToSwap === 0.25) {
    const amount = mulWorklet(inputAssetBalance, 0.25);
    return valueBasedDecimalFormatter({
      nativePrice: inputAssetNativePrice,
      amount,
      roundingMode: 'up',
      precisionAdjustment: precisionBasedOffMagnitude(amount, isStablecoin),
      isStablecoin,
    });
  }
  if (percentageToSwap === 0.5) {
    const amount = mulWorklet(inputAssetBalance, 0.5);
    const precisionAdjustment = precisionBasedOffMagnitude(amount, isStablecoin);
    return valueBasedDecimalFormatter({
      nativePrice: inputAssetNativePrice,
      amount,
      roundingMode: 'up',
      precisionAdjustment,
      isStablecoin,
    });
  }
  if (percentageToSwap === 0.75) {
    const amount = mulWorklet(inputAssetBalance, 0.75);
    return valueBasedDecimalFormatter({
      nativePrice: inputAssetNativePrice,
      amount,
      roundingMode: 'up',
      precisionAdjustment: precisionBasedOffMagnitude(amount, isStablecoin),
      isStablecoin,
    });
  }
  if (percentageToSwap === 1) {
    return inputAssetBalance;
  }

  const decimals = isStablecoin ? STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS : incrementDecimalPlaces;
  const exactIncrement = divWorklet(inputAssetBalance, 100);
  const isIncrementExact = equalWorklet(niceIncrement, exactIncrement);
  const numberOfIncrements = divWorklet(inputAssetBalance, niceIncrement);
  const incrementStep = divWorklet(1, numberOfIncrements);
  const percentage = isIncrementExact
    ? percentageToSwap
    : divWorklet(
        roundWorklet(
          mulWorklet(clamp((sliderXPosition - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1), divWorklet(1, incrementStep))
        ),
        divWorklet(1, incrementStep)
      );

  const rawAmount = mulWorklet(roundWorklet(divWorklet(mulWorklet(percentage, inputAssetBalance), niceIncrement)), niceIncrement);

  const amountToFixedDecimals = toFixedWorklet(rawAmount, decimals);

  const formattedAmount = `${Number(amountToFixedDecimals).toLocaleString('en-US', {
    useGrouping: !stripSeparators,
    minimumFractionDigits: 0,
    maximumFractionDigits: MAXIMUM_SIGNIFICANT_DECIMALS,
  })}`;

  return formattedAmount;
}

export const opacityWorklet = (color: string, opacity: number) => {
  'worklet';

  if (isColor(color)) {
    const rgbaColor = convertToRGBA(color);
    return `rgba(${rgbaColor[0] * 255}, ${rgbaColor[1] * 255}, ${rgbaColor[2] * 255}, ${opacity})`;
  } else {
    return color;
  }
};
//
// /---- END worklet utils ----/ //

export const DEFAULT_SLIPPAGE_BIPS = {
  [ChainId.mainnet]: 100,
  [ChainId.polygon]: 200,
  [ChainId.bsc]: 200,
  [ChainId.optimism]: 200,
  [ChainId.base]: 200,
  [ChainId.zora]: 200,
  [ChainId.arbitrum]: 200,
  [ChainId.avalanche]: 200,
  [ChainId.blast]: 200,
};

export const slippageInBipsToString = (slippageInBips: number) => (slippageInBips / 100).toFixed(1);

export const slippageInBipsToStringWorklet = (slippageInBips: number) => {
  'worklet';
  return (slippageInBips / 100).toFixed(1);
};

export const getDefaultSlippage = (chainId: ChainId, config: RainbowConfig) => {
  const chainName = chainNameFromChainId(chainId) as
    | ChainName.mainnet
    | ChainName.optimism
    | ChainName.polygon
    | ChainName.arbitrum
    | ChainName.base
    | ChainName.zora
    | ChainName.bsc
    | ChainName.avalanche;
  return slippageInBipsToString(
    // NOTE: JSON.parse doesn't type the result as a Record<ChainName, number>
    (config.default_slippage_bips as unknown as Record<ChainName, number>)[chainName] || DEFAULT_SLIPPAGE_BIPS[chainId]
  );
};

export const getDefaultSlippageWorklet = (chainId: ChainId, config: RainbowConfig) => {
  'worklet';

  const chainName = chainNameFromChainIdWorklet(chainId) as
    | ChainName.mainnet
    | ChainName.optimism
    | ChainName.polygon
    | ChainName.arbitrum
    | ChainName.base
    | ChainName.zora
    | ChainName.bsc
    | ChainName.avalanche
    | ChainName.blast;
  return slippageInBipsToStringWorklet(
    (config.default_slippage_bips as unknown as { [key: string]: number })[chainName] || DEFAULT_SLIPPAGE_BIPS[chainId]
  );
};

export type Colors = {
  primary?: string;
  fallback?: string;
  shadow?: string;
};

type ExtractColorValueForColorsProps = {
  colors: TokenColors;
};

export const extractColorValueForColors = ({
  colors,
}: ExtractColorValueForColorsProps): Omit<ExtendedAnimatedAssetWithColors, keyof ParsedSearchAsset | 'maxSwappableAmount'> => {
  const color = colors.primary || colors.fallback;
  const darkColor = color || ETH_COLOR_DARK;
  const lightColor = color || ETH_COLOR;

  const highContrastColor = getHighContrastColor(lightColor);

  return {
    color: {
      light: lightColor,
      dark: darkColor,
    },
    shadowColor: {
      light: lightColor,
      dark: darkColor,
    },
    mixedShadowColor: getMixedShadowColor(lightColor),
    highContrastColor: highContrastColor,
    tintedBackgroundColor: getTintedBackgroundColor(highContrastColor),
    textColor: getTextColor(highContrastColor),
    nativePrice: undefined,
  };
};

export const getColorWorklet = (color: ForegroundColor, isDarkMode: boolean) => {
  'worklet';
  return palettes[isDarkMode ? 'dark' : 'light'].foregroundColors[color];
};

export const getChainColorWorklet = (chainId: ChainId, isDarkMode: boolean): string => {
  'worklet';
  switch (chainId) {
    case ChainId.mainnet:
      return getColorWorklet('mainnet', isDarkMode);
    case ChainId.arbitrum:
      return getColorWorklet('arbitrum', isDarkMode);
    case ChainId.optimism:
      return getColorWorklet('optimism', isDarkMode);
    case ChainId.polygon:
      return getColorWorklet('polygon', isDarkMode);
    case ChainId.base:
      return getColorWorklet('base', isDarkMode);
    case ChainId.zora:
      return getColorWorklet('zora', isDarkMode);
    case ChainId.bsc:
      return getColorWorklet('bsc', isDarkMode);
    case ChainId.avalanche:
      return getColorWorklet('avalanche', isDarkMode);
    case ChainId.blast:
      return getColorWorklet('blast', isDarkMode);
    case ChainId.degen:
      return getColorWorklet('degen', isDarkMode);
    default:
      return getColorWorklet('mainnet', isDarkMode);
  }
};

export const getQuoteServiceTimeWorklet = ({ quote }: { quote: Quote | CrosschainQuote }) => {
  'worklet';
  return (quote as CrosschainQuote)?.routes?.[0]?.serviceTime || 0;
};

const I18N_TIME = {
  singular: {
    hours_long: i18n.t(i18n.l.time.hours.long.singular),
    minutes_short: i18n.t(i18n.l.time.minutes.short.singular),
    seconds_short: i18n.t(i18n.l.time.seconds.short.singular),
  },
  plural: {
    hours_long: i18n.t(i18n.l.time.hours.long.plural),
    minutes_short: i18n.t(i18n.l.time.minutes.short.plural),
    seconds_short: i18n.t(i18n.l.time.seconds.short.plural),
  },
};

export const getCrossChainTimeEstimateWorklet = ({
  serviceTime,
}: {
  serviceTime?: number;
}): {
  isLongWait: boolean;
  timeEstimate?: number;
  timeEstimateDisplay: string;
} => {
  'worklet';

  let isLongWait = false;
  let timeEstimateDisplay;
  const timeEstimate = serviceTime;

  const minutes = Math.floor((timeEstimate || 0) / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) {
    isLongWait = true;
    timeEstimateDisplay = `>${hours} ${hours === 1 ? I18N_TIME.singular.hours_long : I18N_TIME.plural.hours_long}`;
  } else if (minutes >= 1) {
    timeEstimateDisplay = `~${minutes} ${minutes === 1 ? I18N_TIME.singular.minutes_short : I18N_TIME.plural.minutes_short}`;
  } else {
    timeEstimateDisplay = `~${timeEstimate} ${timeEstimate === 1 ? I18N_TIME.singular.seconds_short : I18N_TIME.plural.seconds_short}`;
  }

  return {
    isLongWait,
    timeEstimate,
    timeEstimateDisplay,
  };
};

export const isUnwrapEthWorklet = ({
  buyTokenAddress,
  chainId,
  sellTokenAddress,
}: {
  chainId: ChainId;
  sellTokenAddress: string;
  buyTokenAddress: string;
}) => {
  'worklet';
  return isLowerCaseMatchWorklet(sellTokenAddress, WRAPPED_ASSET[chainId]) && isLowerCaseMatchWorklet(buyTokenAddress, ETH_ADDRESS);
};

export const isWrapEthWorklet = ({
  buyTokenAddress,
  chainId,
  sellTokenAddress,
}: {
  chainId: ChainId;
  sellTokenAddress: string;
  buyTokenAddress: string;
}) => {
  'worklet';
  return isLowerCaseMatchWorklet(sellTokenAddress, ETH_ADDRESS) && isLowerCaseMatchWorklet(buyTokenAddress, WRAPPED_ASSET[chainId]);
};

export const priceForAsset = ({
  asset,
  assetType,
  assetToSellPrice,
  assetToBuyPrice,
}: {
  asset: ParsedSearchAsset | null;
  assetType: 'assetToSell' | 'assetToBuy';
  assetToSellPrice: SharedValue<number>;
  assetToBuyPrice: SharedValue<number>;
}) => {
  'worklet';

  if (!asset) return 0;

  if (assetType === 'assetToSell' && assetToSellPrice.value) {
    return assetToSellPrice.value;
  } else if (assetType === 'assetToBuy' && assetToBuyPrice.value) {
    return assetToBuyPrice.value;
  } else if (asset.price?.value) {
    return asset.price.value;
  } else if (asset.native.price?.amount) {
    return asset.native.price.amount;
  }
  return 0;
};

type ParseAssetAndExtendProps = {
  asset: ParsedSearchAsset | null;
  insertUserAssetBalance?: boolean;
};

const ETH_COLORS: Colors = {
  primary: undefined,
  fallback: undefined,
  shadow: undefined,
};

export const getStandardizedUniqueIdWorklet = ({ address, chainId }: { address: AddressOrEth; chainId: ChainId }) => {
  'worklet';
  return `${address}_${chainId}`;
};

export const parseAssetAndExtend = ({
  asset,
  insertUserAssetBalance,
}: ParseAssetAndExtendProps): ExtendedAnimatedAssetWithColors | null => {
  if (!asset) {
    return null;
  }

  const isAssetEth = asset.isNativeAsset && asset.symbol === 'ETH';
  const colors = extractColorValueForColors({
    colors: (isAssetEth ? ETH_COLORS : asset.colors) as TokenColors,
  });

  const uniqueId = getStandardizedUniqueIdWorklet({ address: asset.address, chainId: asset.chainId });
  const balance = insertUserAssetBalance ? userAssetsStore.getState().getUserAsset(uniqueId)?.balance || asset.balance : asset.balance;

  return {
    ...asset,
    ...colors,
    maxSwappableAmount: balance.amount,
    nativePrice: asset.price?.value,
    balance,

    // For some reason certain assets have a unique ID in the format of `${address}_mainnet` rather than
    // `${address}_${chainId}`, so at least for now we ensure consistency by reconstructing the unique ID here.
    uniqueId,
  };
};

type BuildQuoteParamsProps = {
  currentAddress: string;
  inputAmount: BigNumberish;
  outputAmount: BigNumberish;
  inputAsset: ExtendedAnimatedAssetWithColors | null;
  outputAsset: ExtendedAnimatedAssetWithColors | null;
  lastTypedInput: inputKeys;
};

/**
 * Builds the quote params for the swap based on the current state of the store.
 *
 * NOTE: Will return null if either asset isn't set.
 * @returns data needed to execute a swap or cross-chain swap
 */
export const buildQuoteParams = ({
  currentAddress,
  inputAmount,
  outputAmount,
  inputAsset,
  outputAsset,
  lastTypedInput,
}: BuildQuoteParamsProps): QuoteParams | null => {
  const { source, slippage } = swapsStore.getState();
  if (!inputAsset || !outputAsset) {
    return null;
  }

  const isCrosschainSwap = inputAsset.chainId !== outputAsset.chainId;

  return {
    source: source === 'auto' ? undefined : source,
    chainId: inputAsset.chainId,
    fromAddress: currentAddress,
    sellTokenAddress: inputAsset.isNativeAsset ? ETH_ADDRESS : inputAsset.address,
    buyTokenAddress: outputAsset.isNativeAsset ? ETH_ADDRESS : outputAsset.address,
    // TODO: Handle native input cases below
    sellAmount:
      lastTypedInput === 'inputAmount' || lastTypedInput === 'inputNativeValue'
        ? convertAmountToRawAmount(inputAmount.toString(), inputAsset.decimals)
        : undefined,
    buyAmount:
      lastTypedInput === 'outputAmount' || lastTypedInput === 'outputNativeValue'
        ? convertAmountToRawAmount(outputAmount.toString(), outputAsset.decimals)
        : undefined,
    slippage: Number(slippage),
    refuel: false,
    swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
    toChainId: isCrosschainSwap ? outputAsset.chainId : inputAsset.chainId,
  };
};
