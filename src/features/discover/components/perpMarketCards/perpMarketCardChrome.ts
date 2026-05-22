import { getValueForColorMode, type ColorMode, type ContextualColorValue } from '@/design-system/color/palettes';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { type PerpMarketWithMetadata } from '@/features/perps/types';

export type PriceChangeColors = Readonly<{ negative: string; positive: string }>;

const PRICE_CHANGE_COLORS = {
  dark: { positive: '#3ECF5B', negative: '#FF584D' },
  light: { positive: '#1DB847', negative: '#FA423C' },
} satisfies ContextualColorValue<PriceChangeColors>;

export function buildPerpMarketBaseDisplay(market: PerpMarketWithMetadata, colorMode: ColorMode) {
  const accentColor = market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
  return {
    accentColor,
    iconUrl: market.metadata?.iconUrl,
    priceChangeColors: getValueForColorMode(PRICE_CHANGE_COLORS, colorMode),
  };
}
