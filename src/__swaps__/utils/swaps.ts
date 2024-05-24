import c from 'chroma-js';
import { SharedValue, convertToRGBA, isColor } from 'react-native-reanimated';

import * as i18n from '@/languages';
import { globalColors } from '@/design-system';
import { ETH_COLOR, ETH_COLOR_DARK, SCRUBBER_WIDTH, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { chainNameFromChainId, chainNameFromChainIdWorklet } from '@/__swaps__/utils/chains';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { RainbowConfig } from '@/model/remoteConfig';
import { CrosschainQuote, ETH_ADDRESS, Quote, QuoteParams, SwapType, WRAPPED_ASSET } from '@rainbow-me/swaps';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '../types/assets';
import { inputKeys } from '../types/swap';
import { swapsStore } from '../../state/swaps/swapsStore';
import { BigNumberish } from '@ethersproject/bignumber';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { colors } from '@/styles';
import { convertAmountToRawAmount } from './numbers';

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
  const lightModeContrast = c.contrast(color, globalColors.white100);
  const darkModeContrast = c.contrast(color, globalColors.grey100);

  let lightColor = color;
  let darkColor = color;

  if (lightModeContrast < 2.5) {
    lightColor = c(color)
      .set('hsl.s', `*${lightModeContrast < 1.5 ? 2 : 1.2}`)
      .darken(2.5 - (lightModeContrast - (lightModeContrast < 1.5 ? 0.5 : 0)))
      .hex();
  }

  if (darkModeContrast < 3) {
    darkColor = c(color)
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

export const getTextColor = (color: string): ResponseByTheme<string> => {
  const contrastWithWhite = c.contrast(color, globalColors.white100);

  return {
    light: contrastWithWhite < 2 ? globalColors.grey100 : globalColors.white100,
    dark: contrastWithWhite < 2.6 ? globalColors.grey100 : globalColors.white100,
  };
};

export const getMixedShadowColor = (color?: string | null): ResponseByTheme<string> => {
  return {
    light: getMixedColor(color || ETH_COLOR, colors.dark, 0.84),
    dark: getMixedColor(color || ETH_COLOR_DARK, colors.dark, 0.84),
  };
};

export const getTintedBackgroundColor = (color: string): ResponseByTheme<string> => {
  const lightModeColorToMix = globalColors.white100;
  const darkModeColorToMix = globalColors.grey100;

  return {
    light: c.mix(color, lightModeColorToMix, 0.94).saturate(-0.06).hex(),
    dark: c.mix(color, darkModeColorToMix, 0.9875).saturate(0).hex(),
  };
};
//
// /---- END color functions ----/ //

// /---- 🟢 JS utils 🟢 ----/ //
//
export const clampJS = (value: number, lowerBound: number, upperBound: number) => {
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export const countDecimalPlaces = (number: number): number => {
  'worklet';

  const numAsString = number.toString();

  if (numAsString.includes('.')) {
    // Return the number of digits after the decimal point, excluding trailing zeros
    return numAsString.split('.')[1].replace(/0+$/, '').length;
  }

  // If no decimal point
  return 0;
};

export const findNiceIncrement = (availableBalance: number): number => {
  'worklet';

  // We'll use one of these factors to adjust the base increment
  // These factors are chosen to:
  // a) Produce user-friendly amounts to swap (e.g., 0.1, 0.2, 0.3, 0.4…)
  // b) Limit shifts in the number of decimal places between increments
  const niceFactors = [1, 2, 10];

  // Calculate the exact increment for 100 steps
  const exactIncrement = availableBalance / 100;

  // Calculate the order of magnitude of the exact increment
  const orderOfMagnitude = Math.floor(Math.log10(exactIncrement));
  const baseIncrement = Math.pow(10, orderOfMagnitude);

  let adjustedIncrement = baseIncrement;

  // Find the first nice increment that ensures at least 100 steps
  for (let i = niceFactors.length - 1; i >= 0; i--) {
    const potentialIncrement = baseIncrement * niceFactors[i];
    if (potentialIncrement <= exactIncrement) {
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
export function addCommasToNumber(number: string | number) {
  'worklet';
  const numberString = number.toString();

  if (numberString.includes(',')) {
    return numberString;
  }

  if (Number(number) >= 1000) {
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

export function valueBasedDecimalFormatter(
  amount: number,
  usdTokenPrice: number,
  roundingMode?: 'up' | 'down',
  precisionAdjustment?: number,
  isStablecoin?: boolean,
  stripSeparators = true
): string {
  'worklet';

  function calculateDecimalPlaces(usdTokenPrice: number, precisionAdjustment?: number): number {
    const fallbackDecimalPlaces = 2;
    if (usdTokenPrice <= 0) {
      return fallbackDecimalPlaces;
    }
    const unitsForOneCent = 0.01 / usdTokenPrice;
    if (unitsForOneCent >= 1) {
      return 0;
    }
    return Math.max(Math.ceil(Math.log10(1 / unitsForOneCent)) + (precisionAdjustment ?? 0), 0);
  }

  const decimalPlaces = isStablecoin ? 2 : calculateDecimalPlaces(usdTokenPrice, precisionAdjustment);

  let roundedAmount: number;
  const factor = Math.pow(10, decimalPlaces);

  // Apply rounding based on the specified rounding mode
  if (roundingMode === 'up') {
    roundedAmount = Math.ceil(amount * factor) / factor;
  } else if (roundingMode === 'down') {
    roundedAmount = Math.floor(amount * factor) / factor;
  } else {
    // Default to normal rounding if no rounding mode is specified
    roundedAmount = Math.round(amount * factor) / factor;
  }

  // Format the number to add separators and trim trailing zeros
  const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: !isNaN(decimalPlaces) ? decimalPlaces : 2, // Allow up to the required precision
    useGrouping: true,
  });

  if (stripSeparators) return stripCommas(numberFormatter.format(roundedAmount));

  return numberFormatter.format(roundedAmount);
}

export function niceIncrementFormatter(
  incrementDecimalPlaces: number,
  inputAssetBalance: number,
  inputAssetUsdPrice: number,
  niceIncrement: number,
  percentageToSwap: number,
  sliderXPosition: number,
  stripSeparators?: boolean
) {
  'worklet';
  if (percentageToSwap === 0) return '0';
  if (percentageToSwap === 0.25) return valueBasedDecimalFormatter(inputAssetBalance * 0.25, inputAssetUsdPrice, 'up', -3);
  if (percentageToSwap === 0.5) return valueBasedDecimalFormatter(inputAssetBalance * 0.5, inputAssetUsdPrice, 'up', -3);
  if (percentageToSwap === 0.75) return valueBasedDecimalFormatter(inputAssetBalance * 0.75, inputAssetUsdPrice, 'up', -3);
  if (percentageToSwap === 1) return valueBasedDecimalFormatter(inputAssetBalance, inputAssetUsdPrice, 'up');

  const exactIncrement = inputAssetBalance / 100;
  const isIncrementExact = niceIncrement === exactIncrement;
  const numberOfIncrements = inputAssetBalance / niceIncrement;
  const incrementStep = 1 / numberOfIncrements;
  const percentage = isIncrementExact
    ? percentageToSwap
    : Math.round(clamp((sliderXPosition - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * (1 / incrementStep)) / (1 / incrementStep);

  const rawAmount = Math.round((percentage * inputAssetBalance) / niceIncrement) * niceIncrement;
  const amountToFixedDecimals = rawAmount.toFixed(incrementDecimalPlaces);

  const formattedAmount = `${Number(amountToFixedDecimals).toLocaleString('en-US', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })}`;

  if (stripSeparators) return stripCommas(formattedAmount);

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

export const slippageInBipsToString = (slippageInBips: number) => (slippageInBips / 100).toString();

export const slippageInBipsToStringWorklet = (slippageInBips: number) => {
  'worklet';
  return (slippageInBips / 100).toString();
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

export const isChainDisabledForOutputQuotes = (inputAssetChainId: ChainId) => {
  'worklet';
  return [ChainId.blast].includes(inputAssetChainId);
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
  isDarkMode: boolean;
};

export const extractColorValueForColors = ({
  colors,
}: ExtractColorValueForColorsProps): Omit<ExtendedAnimatedAssetWithColors, keyof ParsedSearchAsset> => {
  const color = colors.primary ?? colors.fallback;

  return {
    color: {
      light: colors.primary ?? colors.fallback ?? ETH_COLOR,
      dark: colors.primary ?? colors.fallback ?? ETH_COLOR_DARK,
    },
    shadowColor: {
      light: colors.shadow ?? ETH_COLOR,
      dark: colors.shadow ?? ETH_COLOR_DARK,
    },
    mixedShadowColor: getMixedShadowColor(colors.shadow),
    highContrastColor: getHighContrastColor(color),
    tintedBackgroundColor: getTintedBackgroundColor(color),
    textColor: getTextColor(color),
    nativePrice: undefined,
  };
};

export const getQuoteServiceTime = ({ quote }: { quote: Quote | CrosschainQuote }) =>
  (quote as CrosschainQuote)?.routes?.[0]?.serviceTime || 0;

export const getCrossChainTimeEstimate = ({
  serviceTime,
}: {
  serviceTime?: number;
}): {
  isLongWait: boolean;
  timeEstimate?: number;
  timeEstimateDisplay: string;
} => {
  let isLongWait = false;
  let timeEstimateDisplay;
  const timeEstimate = serviceTime;

  const minutes = Math.floor((timeEstimate || 0) / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) {
    isLongWait = true;
    timeEstimateDisplay = `>${hours} ${i18n.t(i18n.l.time.hours.long[hours === 1 ? 'singular' : 'plural'])}`;
  } else if (minutes >= 1) {
    timeEstimateDisplay = `~${minutes} ${i18n.t(i18n.l.time.minutes.short[minutes === 1 ? 'singular' : 'plural'])}`;
  } else {
    timeEstimateDisplay = `~${timeEstimate} ${i18n.t(i18n.l.time.seconds.short[timeEstimate === 1 ? 'singular' : 'plural'])}`;
  }

  return {
    isLongWait,
    timeEstimate,
    timeEstimateDisplay,
  };
};
export const isUnwrapEth = ({
  buyTokenAddress,
  chainId,
  sellTokenAddress,
}: {
  chainId: ChainId;
  sellTokenAddress: string;
  buyTokenAddress: string;
}) => {
  return isLowerCaseMatch(sellTokenAddress, WRAPPED_ASSET[chainId]) && isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS);
};

export const isWrapEth = ({
  buyTokenAddress,
  chainId,
  sellTokenAddress,
}: {
  chainId: ChainId;
  sellTokenAddress: string;
  buyTokenAddress: string;
}) => {
  return isLowerCaseMatch(sellTokenAddress, ETH_ADDRESS) && isLowerCaseMatch(buyTokenAddress, WRAPPED_ASSET[chainId]);
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
};

export const parseAssetAndExtend = ({ asset }: ParseAssetAndExtendProps): ExtendedAnimatedAssetWithColors | null => {
  'worklet';

  if (!asset) {
    return null;
  }

  // TODO: Process and add colors to the asset and anything else we'll need for reanimated stuff
  const colors = extractColorValueForColors({
    colors: asset.colors as TokenColors,
    isDarkMode: true, // TODO: Make this not rely on isDarkMode
  });

  const priceInfo: Pick<ExtendedAnimatedAssetWithColors, 'nativePrice'> = {
    nativePrice: undefined,
  };

  if (asset.price) {
    priceInfo.nativePrice = asset.price.value;
  }

  return {
    ...asset,
    ...colors,
    ...priceInfo,
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
    swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
    fromAddress: currentAddress,
    chainId: inputAsset.chainId,
    toChainId: isCrosschainSwap ? outputAsset.chainId : inputAsset.chainId,
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
  };
};
