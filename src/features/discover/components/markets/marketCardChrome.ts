import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';

export type PriceChangeColors = Readonly<{ negative: string; positive: string }>;

const PRICE_CHANGE_COLORS = {
  dark: { positive: '#3ECF5B', negative: '#FF584D' },
  light: { positive: '#1DB847', negative: '#FA423C' },
} satisfies ContextualColorValue<PriceChangeColors>;

export function getMarketPriceChangeColors(colorMode: ColorMode): PriceChangeColors {
  return getValueForColorMode(PRICE_CHANGE_COLORS, colorMode);
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
