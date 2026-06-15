import { useMemo } from 'react';

import { globalColors } from '@/design-system/color/palettes';
import { buildTokenLineChartId, useTokenLineChartsStore } from '@/features/charts/stores/tokenLineChartsStore';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { formatCurrency } from '@/features/currency/utils/formatCurrency';
import { type MarketPillWidthInput } from '@/features/discover/components/markets/cards/MarketPill';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { getPriceChangeColor, getPriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { opacity } from '@/framework/ui/utils/opacity';
import useColorForAsset from '@/hooks/useColorForAsset';
import { getUniqueId } from '@/utils/ethereumUtils';

const MARKET_NEUTRAL_CHART_COLOR = opacity(globalColors.white100, 0.5);
const MARKET_CHART_PRICE_CHANGE_COLORS = {
  ...getPriceChangeColors('dark'),
  neutral: MARKET_NEUTRAL_CHART_COLOR,
};

/**
 * Normalizes a token API price-change value to the shared percent-unit string used by
 * generic market cards. The token metadata API already returns `relativeChange24h` and
 * `change24hPct` in percent units (`"5.23"` == 5.23%), matching the shared
 * `formatNormalizedPercentChange` contract, so no scaling is applied — only a nullish
 * and finite guard.
 */
function normalizeTokenPercentChange(priceChange: number | string | null | undefined): string {
  const value = Number(priceChange ?? 0);
  return isFinite(value) ? String(value) : '0';
}

/**
 * Builds the {@link MarketDisplayItem} for a token placement item, resolving the
 * dominant accent color via {@link useColorForAsset} and memoizing the result.
 */
export function useTokenMarketDisplay({
  item,
  nativeCurrency,
}: {
  item: TokenPlacementItem;
  nativeCurrency: NativeCurrencyKey;
}): MarketDisplayItem {
  const { asset } = item;
  const accentColor = useColorForAsset({
    address: asset.address,
    name: asset.name,
    symbol: asset.symbol,
  });

  return useMemo<MarketDisplayItem>(() => {
    // `asset.price` may be absent for newly-listed or low-liquidity tokens.
    const initialPriceChange = normalizeTokenPercentChange(asset.price?.relativeChange24h);
    const liveTokenId = getUniqueId(asset.address, asset.chainId);

    return {
      id: item.id,
      accentColor,
      chartColor: getTokenPriceChangeChartColor(asset.price?.relativeChange24h),
      chartId: buildTokenLineChartId({ address: asset.address, chainId: asset.chainId, currency: nativeCurrency }),
      chartStore: useTokenLineChartsStore,
      displayName: asset.name,
      iconUrl: asset.iconUrl ?? undefined,
      initialPrice: formatCurrency(asset.price?.value ? String(asset.price.value) : '0', { currency: nativeCurrency }),
      initialPriceLastUpdated: asset.price?.updatedAt,
      initialPriceChange,
      leverage: undefined,
      liveTokenId,
      priceChangeSelector: token => normalizeTokenPercentChange(token.change.change24hPct),
      priceSelector: token => formatCurrency(token.price, { currency: nativeCurrency }),
    };
  }, [accentColor, asset, item.id, nativeCurrency]);
}

export function tokenToMarketPillWidthInput({
  item,
  nativeCurrency,
}: {
  item: TokenPlacementItem;
  nativeCurrency: NativeCurrencyKey;
}): MarketPillWidthInput {
  const { asset } = item;
  return {
    displayName: asset.name,
    initialPrice: formatCurrency(asset.price?.value ? String(asset.price.value) : '0', { currency: nativeCurrency }),
    initialPriceChange: normalizeTokenPercentChange(asset.price?.relativeChange24h),
  };
}

function getTokenPriceChangeChartColor(priceChange: number | string | null | undefined): string {
  return getPriceChangeColor(String(priceChange ?? 0), MARKET_CHART_PRICE_CHANGE_COLORS);
}
