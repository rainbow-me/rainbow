import { useMemo } from 'react';

import { globalColors } from '@/design-system/color/palettes';
import { type MarketPillWidthInput } from '@/features/discover/components/markets/cards/MarketPill';
import { type PerpMarketPlacementItem } from '@/features/discover/stores/placementResolvers/perpsPlacementResolver';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { convertStoredPerpPriceChangeToPercent, getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { getPriceChangeColor, getPriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { opacity } from '@/framework/ui/utils/opacity';

const MARKET_NEUTRAL_CHART_COLOR = opacity(globalColors.white100, 0.5);
const MARKET_CHART_PRICE_CHANGE_COLORS = {
  ...getPriceChangeColors('dark'),
  neutral: MARKET_NEUTRAL_CHART_COLOR,
};

/**
 * Builds the {@link MarketDisplayItem} for a perp market placement item, memoizing
 * the result. The perp analogue of {@link useTokenMarketDisplay}; charts are fetched
 * by `market.symbol` with no metadata gating.
 *
 * Perps store `market.priceChange['24h']` with an extra /100 baked in by
 * `calculatePerpPriceChange24h`, so a +5.23% move is stored as `"0.000523"`.
 * The shared card contract requires percent units (`"5.23"` == 5.23%), so this
 * source hook converts via `convertStoredPerpPriceChangeToPercent` (× 10_000)
 * before populating `initialPriceChange` and `priceChangeSelector`.
 */
export function usePerpMarketDisplay(item: PerpMarketPlacementItem): MarketDisplayItem {
  return useMemo<MarketDisplayItem>(() => {
    const { market } = item;
    const displayName = market.baseSymbol;
    // Convert fractional stored value → percent units for the shared card contract.
    const initialPriceChange = String(convertStoredPerpPriceChangeToPercent(market.priceChange['24h']));

    return {
      id: item.id,
      accentColor: getPerpMarketAccentColor(market),
      chartColor: getPriceChangeColor(initialPriceChange, MARKET_CHART_PRICE_CHANGE_COLORS),
      chartId: market.symbol,
      chartStore: useHyperliquidLineChartsStore,
      displayName,
      iconUrl: market.metadata?.iconUrl,
      initialPrice: formatPerpAssetPrice(market.midPrice ?? market.price),
      initialPriceChange,
      leverage: market.maxLeverage,
      liveTokenId: getHyperliquidTokenId(market.symbol),
      // Live price-change: convert fraction → percent, matching the stored-value contract.
      priceChangeSelector: token => String(convertStoredPerpPriceChangeToPercent(token.change.change24hPct)),
      priceSelector: token => formatPerpAssetPrice(token.midPrice ?? token.price),
    };
  }, [item]);
}

export function perpToMarketPillWidthInput(item: PerpMarketPlacementItem): MarketPillWidthInput {
  const { market } = item;
  return {
    displayName: market.baseSymbol,
    initialPrice: formatPerpAssetPrice(market.midPrice ?? market.price),
    // Convert to percent so pill-width calculation matches the displayed value.
    initialPriceChange: String(convertStoredPerpPriceChangeToPercent(market.priceChange['24h'])),
  };
}

function getPerpMarketAccentColor(market: PerpMarketWithMetadata): string {
  return market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
}
