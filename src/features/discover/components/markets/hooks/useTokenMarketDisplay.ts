import { useMemo } from 'react';

import { globalColors } from '@/design-system/color/palettes';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { buildTokenLineChartId, useTokenLineChartsStore } from '@/features/charts/stores/tokenLineChartsStore';
import { type MarketPillWidthInput } from '@/features/discover/components/markets/cards/MarketPill';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { getPriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency } from '@/helpers/strings';
import useColorForAsset from '@/hooks/useColorForAsset';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getUniqueId } from '@/utils/ethereumUtils';

const TOKEN_SPARKLINE_MAX_POINTS = 24;
const MARKET_NEUTRAL_CHART_COLOR = opacity(globalColors.white100, 0.5);
const MARKET_CHART_PRICE_CHANGE_COLORS = {
  ...getPriceChangeColors('dark'),
  neutral: MARKET_NEUTRAL_CHART_COLOR,
};

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
    const initialPriceChange = normalizeTokenPriceChange(asset.price.relativeChange24h);
    const liveTokenId = getUniqueId(asset.address, asset.chainId);

    return {
      id: item.id,
      accentColor,
      chartColor: getTokenPriceChangeChartColor(asset.price.relativeChange24h),
      chartId: buildTokenLineChartId({ address: asset.address, chainId: asset.chainId, currency: nativeCurrency }),
      chartMaxPoints: TOKEN_SPARKLINE_MAX_POINTS,
      chartStore: useTokenLineChartsStore,
      displayName: asset.name,
      iconUrl: asset.iconUrl || asset.icon_url,
      initialPrice: formatCurrency(asset.price.value ? String(asset.price.value) : '0', { currency: nativeCurrency }),
      initialPriceLastUpdated: asset.price.updatedAt,
      initialPriceChange,
      leverage: undefined,
      liveTokenId,
      onNavigate: () => {
        Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
          asset,
          address: asset.address,
          chainId: asset.chainId,
        });
      },
      pressMetadata: {
        marketId: item.id,
        marketName: asset.name,
        marketSymbol: asset.symbol,
      },
      priceChangeSelector: token => normalizeTokenPriceChange(token.change.change24hPct),
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
    initialPrice: formatCurrency(asset.price.value ? String(asset.price.value) : '0', { currency: nativeCurrency }),
    initialPriceChange: normalizeTokenPriceChange(asset.price.relativeChange24h),
  };
}

function getTokenPriceChangeChartColor(priceChange: number | string | null | undefined): string {
  const value = Number(priceChange || 0);
  if (value > 0) return MARKET_CHART_PRICE_CHANGE_COLORS.positive;
  if (value < 0) return MARKET_CHART_PRICE_CHANGE_COLORS.negative;
  return MARKET_NEUTRAL_CHART_COLOR;
}

function normalizeTokenPriceChange(priceChange: number | string | null | undefined): string {
  const value = Number(priceChange || 0);
  if (!Number.isFinite(value)) return '0';
  return String(value / 10_000);
}
