import { useMemo } from 'react';

import { globalColors } from '@/design-system/color/palettes';
import { type MarketPillWidthInput } from '@/features/discover/components/markets/cards/MarketPill';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { getHyperliquidTokenId, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
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
 */
export function usePerpMarketDisplay(item: PerpMarketPlacementItem): MarketDisplayItem {
  return useMemo<MarketDisplayItem>(() => {
    const { market } = item;
    const displayName = market.baseSymbol;
    const initialPriceChange = market.priceChange['24h'];

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
      onNavigate: () => navigateToPerpDetailScreen(market.symbol),
      pressMetadata: {
        marketId: market.symbol,
        marketName: market.metadata?.name ?? displayName,
        marketSymbol: displayName,
      },
      priceChangeSelector: token => token.change.change24hPct,
      priceSelector: token => formatPerpAssetPrice(token.midPrice ?? token.price),
    };
  }, [item]);
}

export function perpToMarketPillWidthInput(item: PerpMarketPlacementItem): MarketPillWidthInput {
  const { market } = item;
  return {
    displayName: market.baseSymbol,
    initialPrice: formatPerpAssetPrice(market.midPrice ?? market.price),
    initialPriceChange: market.priceChange['24h'],
  };
}

function getPerpMarketAccentColor(market: PerpMarketWithMetadata): string {
  return market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
}
