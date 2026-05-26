import { getValueForColorMode, globalColors, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { opacity } from '@/framework/ui/utils/opacity';

export type PriceChangeColors = Readonly<{ negative: string; positive: string }>;

export const MARKET_SHADOW_COLOR = globalColors.grey100;
export const MARKET_ON_COLOR = globalColors.white100;
export const MARKET_NEUTRAL_CHART_COLOR = opacity(globalColors.white100, 0.5);
export const LIVE_INDICATOR_COLOR = globalColors.red50;
export const LIVE_INDICATOR_BACKGROUND_COLOR = opacity(LIVE_INDICATOR_COLOR, 0.34);

export const LEVERAGE_BADGE_BORDER_COLORS = {
  dark: opacity(globalColors.white100, 0.24),
  light: opacity(globalColors.grey100, 0.07),
} satisfies ContextualColorValue<string>;

export const LEVERAGE_BADGE_SHADOW_OPACITIES = {
  dark: 0.5,
  light: 0.25,
} satisfies ContextualColorValue<number>;

export const MARKET_PRICE_CHANGE_COLORS = {
  dark: { positive: globalColors.green50, negative: globalColors.red50 },
  light: { positive: globalColors.green60, negative: globalColors.red60 },
} satisfies ContextualColorValue<PriceChangeColors>;

export function getMarketPriceChangeColors(colorMode: ColorMode): PriceChangeColors {
  return getValueForColorMode(MARKET_PRICE_CHANGE_COLORS, colorMode);
}

export function getMarketPriceChangeColor(priceChange: string, priceChangeColors: PriceChangeColors): string {
  return Number(priceChange) >= 0 ? priceChangeColors.positive : priceChangeColors.negative;
}

export function buildMarketBaseDisplay(
  { accentColor, iconUrl }: { accentColor: string; iconUrl: string | undefined },
  colorMode: ColorMode
) {
  return {
    accentColor,
    iconUrl,
    priceChangeColors: getMarketPriceChangeColors(colorMode),
  };
}
